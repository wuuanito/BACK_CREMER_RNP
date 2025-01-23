// src/config/database.js
const { Sequelize } = require('sequelize');
require('dotenv').config();

// Database connection configuration
const sequelize = new Sequelize(
    process.env.DB_NAME, 
    process.env.DB_USER, 
    process.env.DB_PASSWORD, 
    {
        host: process.env.DB_HOST,
        dialect: 'mysql',
        logging: false, // Disable logging in production
        pool: {
            max: 5, // Maximum number of connection in pool
            min: 0, // Minimum number of connection in pool
            acquire: 30000, // Maximum time to acquire a connection
            idle: 10000 // Idle time before releasing a connection
        }
    }
);

// Test the database connection
const testConnection = async () => {
    try {
        await sequelize.authenticate();
        console.log('Database connection has been established successfully.');
    } catch (error) {
        console.error('Unable to connect to the database:', error);
    }
};

module.exports = {
    sequelize,
    testConnection
};