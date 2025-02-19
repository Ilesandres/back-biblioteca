const { Libro, Usuario, Prestamo, Resena } = require('../models');
const { Op } = require('sequelize');

const getStats = async (req, res) => {
    try {
        const [totalLibros, usuariosActivos, prestamosActivos, totalResenas] = await Promise.all([
            Libro.count(),
            Usuario.count({ where: { estado: 'activo' } }),
            Prestamo.count({ where: { estado: 'activo' } }),
            Resena.count()
        ]);

        res.json({
            totalLibros,
            usuariosActivos,
            prestamosActivos,
            totalResenas
        });
    } catch (error) {
        console.error('Error al obtener estadísticas:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener estadísticas',
            error: error.message
        });
    }
};

module.exports = {
    getStats
};