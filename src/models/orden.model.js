// src/models/orden.model.js
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

// Orden (Order) Model Definition
const Orden = sequelize.define('Orden', {
    // Unique identifier (automatically added by Sequelize)
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    // Name of the order
    nombre: {
        type: DataTypes.STRING(100),
        allowNull: false,
        validate: {
            notNull: { msg: "Order name is required" },
            len: [1, 100]
        }
    },
    // Optional description of the order
    descripcion: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    // Start time of the order
    horaInicio: {
        type: DataTypes.DATE,
        allowNull: true
    },
    // End time of the order
    horaFin: {
        type: DataTypes.DATE,
        allowNull: true
    },
    // Total time of the order in seconds (excluding pauses)
    tiempoTotal: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 0,
        validate: {
            min: 0
        }
    },
    // Total pause time in seconds
    tiempoTotalPausas: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 0,
        validate: {
            min: 0
        }
    }
}, {
    // Additional model options
    tableName: 'ordenes', // Explicit table name
    timestamps: true, // Add createdAt and updatedAt fields
    indexes: [
        // Create an index on the createdAt field for faster queries
        {
            fields: ['createdAt']
        }
    ]
});

module.exports = Orden;