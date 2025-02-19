const Libro = require('../models/Libro');
const Usuario = require('../models/Usuario');
const Prestamo = require('../models/Prestamo');
const Resena = require('../models/Resena');
const { Op } = require('sequelize');

const getStats = async (req, res) => {
    try {
        // Add logging to track the process
        console.log('Iniciando obtención de estadísticas...');

        const [totalLibros, usuariosActivos, prestamosActivos, totalResenas] = await Promise.all([
            Libro.count().then(count => {
                console.log('Total libros:', count);
                return count;
            }),
            Usuario.count({ 
                where: { estado: 'activo' } 
            }).then(count => {
                console.log('Usuarios activos:', count);
                return count;
            }),
            Prestamo.count({ 
                where: { estado: 'activo' } 
            }).then(count => {
                console.log('Préstamos activos:', count);
                return count;
            }),
            Resena.count().then(count => {
                console.log('Total reseñas:', count);
                return count;
            })
        ]);

        console.log('Estadísticas obtenidas exitosamente');

        res.json({
            success: true,
            data: {
                totalLibros,
                usuariosActivos,
                prestamosActivos,
                totalResenas
            }
        });
    } catch (error) {
        console.error('Error detallado al obtener estadísticas:', error);
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