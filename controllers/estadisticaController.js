const { Estadistica, Resena } = require('../models');
const { Op } = require('sequelize');
const sequelize = require('../config/database');
const Prestamo = require('../models/Prestamo');
const Libro = require('../models/Libro');

const actualizarEstadisticas = async (libroId) => {
    try {
        // Buscar o crear estadísticas para el libro
        const [estadistica] = await Estadistica.findOrCreate({
            where: { libroId }
        });

        // Calcular número de préstamos
        const vecesPrestado = await Prestamo.count({
            where: { libroId }
        });

        // Calcular promedio de calificaciones
        const resenas = await Resena.findAll({
            where: { libroId },
            attributes: [
                [sequelize.fn('AVG', sequelize.col('calificacion')), 'promedio'],
                [sequelize.fn('COUNT', sequelize.col('id')), 'total']
            ]
        });

        const calificacionPromedio = resenas[0].getDataValue('promedio') || 0;
        const numeroResenas = resenas[0].getDataValue('total') || 0;

        // Obtener fecha del último préstamo
        const ultimoPrestamo = await Prestamo.findOne({
            where: { libroId },
            order: [['fechaPrestamo', 'DESC']],
            attributes: ['fechaPrestamo']
        });

        // Actualizar estadísticas
        await estadistica.update({
            vecesPrestado,
            calificacionPromedio,
            numeroResenas,
            ultimoPrestamo: ultimoPrestamo?.fechaPrestamo
        });

        return estadistica;
    } catch (error) {
        console.error('Error al actualizar estadísticas:', error);
        throw error;
    }
};

const obtenerEstadisticasLibro = async (req, res) => {
    try {
        const estadisticas = await Estadistica.findOne({ libro: req.params.libroId })
            .populate('libro', 'titulo autor');

        if (!estadisticas) {
            return res.status(404).json({
                success: false,
                message: 'No se encontraron estadísticas para este libro'
            });
        }

        res.json({
            success: true,
            data: estadisticas
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error al obtener estadísticas',
            error: error.message
        });
    }
};

// ¡Dashboard de estadísticas! Muestra información general del sistema
const obtenerEstadisticasGenerales = async (req, res) => {
    try {
        // ¡Obtenemos toda la información importante de una vez!
        const [librosPopulares, usuariosActivos, prestamosVencidos] = await Promise.all([
            // Los libros más solicitados
            Estadistica.find()
                .sort('-totalPrestamos')
                .limit(10)
                .populate('libro', 'titulo autor'),
            // Nuestros lectores más activos
            Prestamo.aggregate([
                { $group: { 
                    _id: '$usuario',
                    totalPrestamos: { $sum: 1 }
                }},
                { $sort: { totalPrestamos: -1 }},
                { $limit: 10 }
            ]),
            // Préstamos que necesitan atención
            Prestamo.find({
                estado: 'activo',
                fechaDevolucion: { $lt: new Date() }
            }).populate('usuario libro')
        ]);

        res.json({
            success: true,
            data: {
                librosPopulares,
                usuariosActivos,
                prestamosVencidos,
                resumen: {
                    totalLibrosPopulares: librosPopulares.length,
                    totalUsuariosActivos: usuariosActivos.length,
                    totalPrestamosVencidos: prestamosVencidos.length
                }
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error al obtener estadísticas generales',
            error: error.message
        });
    }
};

module.exports = {
    actualizarEstadisticas,
    obtenerEstadisticasLibro,
    obtenerEstadisticasGenerales
}; 