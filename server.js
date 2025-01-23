// server.js
require('dotenv').config(); // Load environment variables
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./docs/swagger.json');

// Database and Socket configuration
const { sequelize, testConnection } = require('./src/config/database');
const initializeSocketIO = require('./src/config/socket');

// Routes
const ordenRoutes = require('./src/routes/orden.routes');

// Create Express application
const app = express();

// Middleware configuration
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Swagger documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Routes middleware
app.use('/ordenes', (req, res, next) => {
    req.io = socketIO; // Attach socket to request for use in controllers
    next();
}, ordenRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        error: 'Something went wrong!',
        message: process.env.NODE_ENV === 'production' 
            ? 'Internal Server Error' 
            : err.message
    });
});

// Port configuration
const PORT = 4000;

// Initialize database and start server
async function startServer() {
    try {
        // Test database connection
        await testConnection();

        // Sync database models
        await sequelize.sync({ alter: true });
        console.log('Database models synchronized successfully.');

        // Initialize Socket.IO
        const { server, io } = initializeSocketIO(app);
        global.socketIO = io; // Make socket globally available

        // Start server
        server.listen(PORT, () => {
            console.log(`Server running on http://localhost:${PORT}`);
            console.log(`Swagger docs available at http://localhost:${PORT}/api-docs`);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
}

// Start the server
startServer();