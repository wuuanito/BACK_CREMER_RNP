// src/controllers/orden.controller.js
const Orden = require('../models/orden.model');
const Pausa = require('../models/pausa.model');
const { Op } = require('sequelize');

class OrdenController {
    // Create a new order
    async createOrder(req, res) {
        try {
            const { nombre, descripcion } = req.body;
            const nuevaOrden = await Orden.create({ 
                nombre, 
                descripcion 
            });
            
            // Emit event through socket (assuming io is passed)
            req.io.emit('ordenCreada', nuevaOrden);
            
            res.status(201).json(nuevaOrden);
        } catch (error) {
            res.status(500).json({ 
                error: 'Error creating order', 
                details: error.message 
            });
        }
    }

    // Start an order
    async startOrder(req, res) {
        try {
            const orden = await Orden.findByPk(req.params.id);
            if (!orden) {
                return res.status(404).json({ error: 'Order not found' });
            }

            // Prevent restarting an already started order
            if (orden.horaInicio) {
                return res.status(400).json({ error: 'Order has already been started' });
            }

            orden.horaInicio = new Date();
            await orden.save();

            req.io.emit('ordenActualizada', orden);
            res.json(orden);
        } catch (error) {
            res.status(500).json({ 
                error: 'Error starting order', 
                details: error.message 
            });
        }
    }

    // Pause an order
    async pauseOrder(req, res) {
        try {
            const { motivo } = req.body;
            const orden = await Orden.findByPk(req.params.id);
            
            if (!orden) {
                return res.status(404).json({ error: 'Order not found' });
            }

            // Check for an active pause
            const pausaActiva = await Pausa.findOne({ 
                where: { 
                    OrdenId: orden.id, 
                    fin: null 
                } 
            });

            if (pausaActiva) {
                return res.status(400).json({ error: 'An active pause already exists for this order' });
            }

            const nuevaPausa = await Pausa.create({ 
                motivo, 
                inicio: new Date(), 
                OrdenId: orden.id 
            });

            req.io.emit('ordenActualizada', orden);
            res.status(201).json(nuevaPausa);
        } catch (error) {
            res.status(500).json({ 
                error: 'Error pausing order', 
                details: error.message 
            });
        }
    }

    // Resume an order after pause
    async resumeOrder(req, res) {
        try {
            const orden = await Orden.findByPk(req.params.id);
            if (!orden) {
                return res.status(404).json({ error: 'Order not found' });
            }

            const pausaActiva = await Pausa.findOne({ 
                where: { 
                    OrdenId: orden.id, 
                    fin: null 
                } 
            });

            if (!pausaActiva) {
                return res.status(400).json({ error: 'No active pause for this order' });
            }

            // Calculate pause duration
            pausaActiva.fin = new Date();
            pausaActiva.tiempo = Math.floor((pausaActiva.fin - pausaActiva.inicio) / 1000);
            await pausaActiva.save();

            // Update total pause time for the order
            orden.tiempoTotalPausas += pausaActiva.tiempo;
            await orden.save();

            req.io.emit('ordenActualizada', orden);
            res.json(pausaActiva);
        } catch (error) {
            res.status(500).json({ 
                error: 'Error resuming order', 
                details: error.message 
            });
        }
    }

    // Finish an order
    async finishOrder(req, res) {
        try {
            const orden = await Orden.findByPk(req.params.id);
            if (!orden) {
                return res.status(404).json({ error: 'Order not found' });
            }

            if (!orden.horaInicio) {
                return res.status(400).json({ error: 'Order has not been started' });
            }

            orden.horaFin = new Date();
            orden.tiempoTotal = Math.floor((orden.horaFin - orden.horaInicio) / 1000) - orden.tiempoTotalPausas;
            await orden.save();

            req.io.emit('ordenActualizada', orden);
            res.json(orden);
        } catch (error) {
            res.status(500).json({ 
                error: 'Error finishing order', 
                details: error.message 
            });
        }
    }

    // Get all orders with their pauses
    async getAllOrders(req, res) {
        try {
            const ordenes = await Orden.findAll({ 
                include: { 
                    model: Pausa, 
                    as: 'pausas' 
                },
                order: [['createdAt', 'DESC']] // Most recent first
            });
            res.json(ordenes);
        } catch (error) {
            res.status(500).json({ 
                error: 'Error retrieving orders', 
                details: error.message 
            });
        }
    }

    // Get detailed report for a specific order
    async getOrderReport(req, res) {
        try {
            const orden = await Orden.findByPk(req.params.id, { 
                include: { 
                    model: Pausa, 
                    as: 'pausas' 
                } 
            });

            if (!orden) {
                return res.status(404).json({ error: 'Order not found' });
            }

            const reporte = {
                id: orden.id,
                nombre: orden.nombre,
                descripcion: orden.descripcion,
                horaInicio: orden.horaInicio,
                horaFin: orden.horaFin,
                tiempoTotal: orden.tiempoTotal,
                tiempoTotalPausas: orden.tiempoTotalPausas,
                pausas: orden.pausas.map(p => ({
                    motivo: p.motivo,
                    inicio: p.inicio,
                    fin: p.fin,
                    tiempo: p.tiempo
                }))
            };

            res.json(reporte);
        } catch (error) {
            res.status(500).json({ 
                error: 'Error generating order report', 
                details: error.message 
            });
        }
    }
}

module.exports = new OrdenController();