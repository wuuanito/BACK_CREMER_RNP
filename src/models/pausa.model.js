// src/models/pausa.model.js
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const Orden = require('./orden.model');

// Pausa (Pause) Model Definition
const Pausa = sequelize.define('Pausa', {
    // Unique identifier (automatically added by Sequelize)
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    // Reason for the pause
    motivo: {
        type: DataTypes.STRING(255),
        allowNull: false,
        validate: {
            notNull: { msg: "Pause reason is required" },
            len: [1, 255]
        }
    },
    // Start time of the pause
    inicio: {
        type: DataTypes.DATE,
        allowNull: false,
        validate: {
            notNull: { msg: "Pause start time is required" }
        }
    },
    // End time of the pause
    fin: {
        type: DataTypes.DATE,
        allowNull: true
    },
    // Duration of the pause in seconds
    tiempo: {
        type: DataTypes.INTEGER,
        allowNull: true,
        validate: {
            min: 0
        }
    }
}, {
    // Additional model options
    tableName: 'pausas', // Explicit table name
    timestamps: true // Add createdAt and updatedAt fields
});

// Define Association
Pausa.belongsTo(Orden); // Each pause belongs to an order
Orden.hasMany(Pausa, { 
    as: 'pausas',
    foreignKey: 'OrdenId'
});

module.exports = Pausa;