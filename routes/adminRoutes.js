const express = require('express');
const router = express.Router();
const { protegerRuta } = require('../middlewares/auth');
const { esAdmin } = require('../middlewares/roles');
const { getStats } = require('../controllers/adminController');
const Prestamo = require('../models/Prestamo');
const Usuario = require('../models/Usuario');
const { Op } = require('sequelize');

// Ruta para obtener estadísticas generales
router.get('/stats', protegerRuta, esAdmin, getStats);

// Ruta para obtener préstamos vencidos
router.get('/prestamos/vencidos', protegerRuta, esAdmin, async (req, res) => {
    try {
        const prestamosVencidos = await Prestamo.findAll({
            where: {
                estado: 'activo',
                fechaDevolucion: {
                    [Op.lt]: new Date()
                }
            },
            include: ['usuario', 'libro']
        });

        res.json({
            success: true,
            data: prestamosVencidos
        });
    } catch (error) {
        console.error('Error al obtener préstamos vencidos:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener préstamos vencidos',
            error: error.message
        });
    }
});

// Ruta para obtener usuarios más activos
router.get('/usuarios/activos', protegerRuta, esAdmin, async (req, res) => {
    try {
        const usuariosActivos = await Prestamo.findAll({
            attributes: [
                'usuarioId',
                [Prestamo.sequelize.fn('COUNT', '*'), 'totalPrestamos']
            ],
            group: ['usuarioId'],
            order: [[Prestamo.sequelize.fn('COUNT', '*'), 'DESC']],
            limit: 10,
            include: ['usuario']
        });

        res.json({
            success: true,
            data: usuariosActivos
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error al obtener usuarios activos',
            error: error.message
        });
    }
});

// Ruta para obtener todos los usuarios
router.get('/usuarios', protegerRuta, esAdmin, async (req, res) => {
    try {
        const usuarios = await Usuario.findAll({
            attributes: ['id', 'nombre', 'email', 'rol', 'estado'],
            order: [['id', 'ASC']]
        });

        res.json({
            success: true,
            data: usuarios
        });
    } catch (error) {
        console.error('Error al obtener usuarios:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener usuarios',
            error: error.message
        });
    }
});

module.exports = router;