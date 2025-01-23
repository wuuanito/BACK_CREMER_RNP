// Importar módulos necesarios
const express = require('express');
const bodyParser = require('body-parser');
const { Sequelize, DataTypes } = require('sequelize');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

// Inicializar aplicación Express
const app = express();
const PORT = 3000;

// Crear servidor HTTP y vincularlo a Socket.IO
const server = http.createServer(app);
const io = new Server(server);

// Configuración del middleware
app.use(bodyParser.json());
app.use(cors());

// Conexión a la base de datos MySQL
const sequelize = new Sequelize('ordenes_cremer', 'root', 'root', {
    host: 'localhost',
    dialect: 'mysql'
});

// Definición de modelos
const Orden = sequelize.define('Orden', {
    nombre: { type: DataTypes.STRING, allowNull: false },
    descripcion: { type: DataTypes.STRING, allowNull: true },
    horaInicio: { type: DataTypes.DATE, allowNull: true },
    horaFin: { type: DataTypes.DATE, allowNull: true },
    tiempoTotal: { type: DataTypes.INTEGER, allowNull: true, defaultValue: 0 }, // en segundos
    tiempoTotalPausas: { type: DataTypes.INTEGER, allowNull: true, defaultValue: 0 } // en segundos
});

const Pausa = sequelize.define('Pausa', {
    motivo: { type: DataTypes.STRING, allowNull: false },
    inicio: { type: DataTypes.DATE, allowNull: false },
    fin: { type: DataTypes.DATE, allowNull: true },
    tiempo: { type: DataTypes.INTEGER, allowNull: true } // en segundos
});

// Relación entre Orden y Pausa
Orden.hasMany(Pausa, { as: 'pausas' });
Pausa.belongsTo(Orden);

// Sincronizar modelos con la base de datos
sequelize.sync({ force: true }).then(() => {
    console.log('Base de datos sincronizada.');
}).catch(err => console.error('Error al sincronizar la base de datos:', err));

// Escuchar conexiones de WebSocket
io.on('connection', (socket) => {
    console.log('Cliente conectado');

    socket.on('disconnect', () => {
        console.log('Cliente desconectado');
    });
});

// Rutas

// Crear una nueva orden
app.post('/ordenes', async (req, res) => {
    try {
        const { nombre, descripcion } = req.body;
        const nuevaOrden = await Orden.create({ nombre, descripcion });
        io.emit('ordenCreada', nuevaOrden); // Emitir evento
        res.status(201).json(nuevaOrden);
    } catch (error) {
        res.status(500).json({ error: 'Error al crear la orden.' });
    }
});

// Iniciar una orden
app.put('/ordenes/:id/iniciar', async (req, res) => {
    try {
        const orden = await Orden.findByPk(req.params.id);
        if (!orden) return res.status(404).json({ error: 'Orden no encontrada.' });

        orden.horaInicio = new Date();
        await orden.save();
        io.emit('ordenActualizada', orden); // Emitir evento
        res.json(orden);
    } catch (error) {
        res.status(500).json({ error: 'Error al iniciar la orden.' });
    }
});

// Pausar una orden
app.post('/ordenes/:id/pausar', async (req, res) => {
    try {
        const { motivo } = req.body;
        const orden = await Orden.findByPk(req.params.id);
        if (!orden) return res.status(404).json({ error: 'Orden no encontrada.' });

        const pausaActiva = await Pausa.findOne({ where: { OrdenId: orden.id, fin: null } });
        if (pausaActiva) return res.status(400).json({ error: 'Ya existe una pausa activa para esta orden.' });

        const nuevaPausa = await Pausa.create({ motivo, inicio: new Date(), OrdenId: orden.id });
        io.emit('ordenActualizada', orden); // Emitir evento
        res.status(201).json(nuevaPausa);
    } catch (error) {
        res.status(500).json({ error: 'Error al pausar la orden.' });
    }
});

// Reanudar una pausa
app.put('/ordenes/:id/reanudar', async (req, res) => {
    try {
        const orden = await Orden.findByPk(req.params.id);
        if (!orden) return res.status(404).json({ error: 'Orden no encontrada.' });

        const pausaActiva = await Pausa.findOne({ where: { OrdenId: orden.id, fin: null } });
        if (!pausaActiva) return res.status(400).json({ error: 'No hay pausa activa para esta orden.' });

        pausaActiva.fin = new Date();
        pausaActiva.tiempo = Math.floor((pausaActiva.fin - pausaActiva.inicio) / 1000); // Tiempo en segundos
        await pausaActiva.save();

        orden.tiempoTotalPausas += pausaActiva.tiempo;
        await orden.save();

        io.emit('ordenActualizada', orden); // Emitir evento
        res.json(pausaActiva);
    } catch (error) {
        res.status(500).json({ error: 'Error al reanudar la orden.' });
    }
});

// Finalizar una orden
app.put('/ordenes/:id/finalizar', async (req, res) => {
    try {
        const orden = await Orden.findByPk(req.params.id);
        if (!orden) return res.status(404).json({ error: 'Orden no encontrada.' });

        if (!orden.horaInicio) return res.status(400).json({ error: 'La orden no ha sido iniciada.' });

        orden.horaFin = new Date();
        orden.tiempoTotal = Math.floor((orden.horaFin - orden.horaInicio) / 1000) - orden.tiempoTotalPausas; // Excluir tiempo de pausas
        await orden.save();

        io.emit('ordenActualizada', orden); // Emitir evento
        res.json(orden);
    } catch (error) {
        res.status(500).json({ error: 'Error al finalizar la orden.' });
    }
});

// Obtener todas las órdenes con sus pausas
app.get('/ordenes', async (req, res) => {
    try {
        const ordenes = await Orden.findAll({ include: { model: Pausa, as: 'pausas' } });
        res.json(ordenes);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener las órdenes.' });
    }
});

// Obtener el estado de una orden específica en tiempo real
app.get('/ordenes/:id/estado', async (req, res) => {
    try {
        const orden = await Orden.findByPk(req.params.id, { include: { model: Pausa, as: 'pausas' } });
        if (!orden) return res.status(404).json({ error: 'Orden no encontrada.' });

        res.json(orden);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener el estado de la orden.' });
    }
});

// Reporte detallado de una orden específica
app.get('/ordenes/:id/reporte', async (req, res) => {
    try {
        const orden = await Orden.findByPk(req.params.id, { include: { model: Pausa, as: 'pausas' } });
        if (!orden) return res.status(404).json({ error: 'Orden no encontrada.' });

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
        res.status(500).json({ error: 'Error al generar el reporte de la orden.' });
    }
});

// Iniciar el servidor
server.listen(PORT, () => {
    console.log(`Servidor escuchando en http://localhost:${PORT}`);
});
