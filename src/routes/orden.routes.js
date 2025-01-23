// src/routes/orden.routes.js
const express = require('express');
const ordenController = require('../controllers/orden.controller');

const router = express.Router();

/**
 * @route POST /ordenes
 * @desc Create a new order
 * @access Public
 */
router.post('/', ordenController.createOrder);

/**
 * @route PUT /ordenes/:id/iniciar
 * @desc Start an order
 * @access Public
 */
router.put('/:id/iniciar', ordenController.startOrder);

/**
 * @route POST /ordenes/:id/pausar
 * @desc Pause an order
 * @access Public
 */
router.post('/:id/pausar', ordenController.pauseOrder);

/**
* @route PUT /ordenes/:id/reanudar
 * @desc Resume an order after pause
 * @access Public
 */
router.put('/:id/reanudar', ordenController.resumeOrder);

/**
 * @route PUT /ordenes/:id/finalizar
 * @desc Finish an order
 * @access Public
 */
router.put('/:id/finalizar', ordenController.finishOrder);

/**
 * @route GET /ordenes
 * @desc Get all orders with their pauses
 * @access Public
 */
router.get('/', ordenController.getAllOrders);

/**
 * @route GET /ordenes/:id/reporte
 * @desc Get detailed report for a specific order
 * @access Public
 */
router.get('/:id/reporte', ordenController.getOrderReport);

module.exports = router;