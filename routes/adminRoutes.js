const express = require('express');
const router = express.Router();
const { protegerRuta } = require('../middlewares/auth');
const { esAdmin } = require('../middlewares/roles');
const { getStats } = require('../controllers/adminController');

router.get('/stats', protegerRuta, esAdmin, getStats);

// Rutas adicionales para el panel de administración
router.get('/prestamos/vencidos', protegerRuta, esAdmin, async (req, res) => {
    try {
        const prestamosVencidos = await Prestamo.find({
            estado: 'activo',
            fechaDevolucion: { $lt: new Date() }
        }).populate('usuario libro');

        res.json({
            success: true,
            data: prestamosVencidos
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error al obtener préstamos vencidos',
            error: error.message
        });
    }
});

router.get('/usuarios/activos', protegerRuta, esAdmin, async (req, res) => {
    try {
        const usuariosActivos = await Prestamo.aggregate([
            { $group: { 
                _id: '$usuario',
                totalPrestamos: { $sum: 1 }
            }},
            { $sort: { totalPrestamos: -1 }},
            { $limit: 10 }
        ]);

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

module.exports = router;