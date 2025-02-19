const { Resena, Libro, Usuario } = require('../models');
const { actualizarEstadisticas } = require('./estadisticaController');

// ¡Nueva reseña! Permite a los usuarios compartir su opinión
const crearResena = async (req, res) => {
    try {
        const { libroId, calificacion, comentario } = req.body;

        const resena = await Resena.create({
            libroId,
            usuarioId: req.usuario.id,
            calificacion,
            comentario
        });

        // Actualizar estadísticas del libro
        await actualizarEstadisticas(libroId);

        const resenaCompleta = await Resena.findByPk(resena.id, {
            include: [
                {
                    model: Usuario,
                    attributes: ['nombre']
                },
                {
                    model: Libro,
                    attributes: ['titulo']
                }
            ]
        });

        res.status(201).json({
            success: true,
            data: resenaCompleta,
            message: '¡Gracias por compartir tu opinión!'
        });
    } catch (error) {
        if (error.name === 'SequelizeUniqueConstraintError') {
            return res.status(400).json({
                success: false,
                message: '¡Ya has compartido tu opinión sobre este libro!'
            });
        }

        res.status(400).json({
            success: false,
            message: 'Error al crear la reseña',
            error: error.message
        });
    }
};

// ¡Obtener todas las reseñas de un libro!
const obtenerResenasLibro = async (req, res) => {
    try {
        const resenas = await Resena.findAll({
            where: { libroId: req.params.libroId },
            include: [
                {
                    model: Usuario,
                    attributes: ['nombre']
                }
            ],
            order: [['createdAt', 'DESC']]
        });

        res.json({
            success: true,
            data: resenas
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error al obtener las reseñas',
            error: error.message
        });
    }
};

module.exports = {
    crearResena,
    obtenerResenasLibro
}; 