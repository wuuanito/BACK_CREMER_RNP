// src/config/socket.js
const { Server } = require('socket.io');
const http = require('http');
const express = require('express');

/**
 * Initialize Socket.IO server
 * @param {express.Application} app - Express application
 * @returns {Server} Socket.IO server instance
 */
function initializeSocketIO(app) {
    // Create HTTP server from Express app
    const server = http.createServer(app);
    
    // Initialize Socket.IO with CORS configuration
    const io = new Server(server, {
        cors: {
            origin: '*', // Be more specific in production
            methods: ['GET', 'POST', 'PUT', 'DELETE']
        }
    });

    // Socket connection event handler
    io.on('connection', (socket) => {
        console.log('New client connected:', socket.id);

        // Log disconnections
        socket.on('disconnect', () => {
            console.log('Client disconnected:', socket.id);
        });

        // Optional: Add custom event listeners here
        // For example:
        // socket.on('custom-event', (data) => { ... });
    });

    return { server, io };
}

module.exports = initializeSocketIO;