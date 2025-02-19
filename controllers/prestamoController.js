const { Prestamo, Libro, Usuario, Notificacion } = require('../models');
const { Op } = require('sequelize');
const { actualizarEstadisticas } = require('./estadisticaController');
const NotificationService = require('../services/notificationService');

// Extender el período de préstamo
const extenderPrestamo = async (req, res) => {
    try {
        const prestamoId = req.params.id;
        const prestamo = await Prestamo.findOne({
            where: {
                id: prestamoId,
                usuarioId: req.user.id,
                devuelto: false
            }
        });

        if (!prestamo) {
            return res.status(404).json({
                success: false,
                message: 'Préstamo no encontrado o no autorizado'
            });
        }

        // Calcular nueva fecha de devolución (7 días adicionales)
        const nuevaFechaDevolucion = new Date(prestamo.fechaDevolucion);
        nuevaFechaDevolucion.setDate(nuevaFechaDevolucion.getDate() + 7);

        // Actualizar el préstamo
        await prestamo.update({
            fechaDevolucion: nuevaFechaDevolucion
        });

        // Crear notificación en tiempo real
        try {
            await NotificationService.createNotification({
                usuarioId: req.user.id,
                tipo: 'extension',
                mensaje: `El período de préstamo ha sido extendido hasta ${nuevaFechaDevolucion.toLocaleDateString()}`,
                referenciaTipo: 'prestamo',
                referenciaId: prestamoId
            });
        } catch (notificationError) {
            console.error('Error al crear la notificación:', notificationError);
            // Continuar con la operación incluso si falla la notificación
        }

        res.status(200).json({
            success: true,
            message: 'Período de préstamo extendido exitosamente',
            data: {
                id: prestamo.id,
                nuevaFechaDevolucion
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error al extender el período de préstamo',
            error: error.message
        });
    }
};

// Obtener préstamos del usuario
const obtenerPrestamosUsuario = async (req, res) => {
    try {
        const prestamos = await Prestamo.findAll({
            where: { usuarioId: req.user.id },
            include: [{
                model: Libro,
                attributes: ['titulo', 'autor', 'portada']
            }],
            order: [['createdAt', 'DESC']]
        });

        res.status(200).json({
            success: true,
            data: prestamos
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error al obtener los préstamos',
            error: error.message
        });
    }
};

// ¡Nuevo préstamo! Permite a los usuarios tomar prestado un libro
const crearPrestamo = async (req, res) => {
    try {
        const { libroId, fechaDevolucion } = req.body;
        const usuarioId = req.user.id;

        // Validar que los IDs sean números válidos
        if (!libroId || !usuarioId) {
            return res.status(400).json({
                success: false,
                message: 'Se requieren los IDs del libro y usuario'
            });
        }

        // Verificar disponibilidad del libro
        const libro = await Libro.findByPk(libroId);
        if (!libro) {
            return res.status(404).json({
                success: false,
                message: 'Libro no encontrado'
            });
        }


        if (!libro.disponible || libro.copias < 1) {
            return res.status(400).json({
                success: false,
                message: '¡Lo sentimos! Este libro no está disponible para préstamo'
            });
        }

        // Crear el préstamo con IDs explícitos
        const prestamo = await Prestamo.create({
            libroId: libroId,
            usuarioId: usuarioId,
            fechaDevolucion: new Date(fechaDevolucion)
        });
        console.log( "libro : "+libroId+" usuario id : "+usuarioId+" fecha : "+fechaDevolucion)
        console.log(prestamo);

        // Actualizar disponibilidad y crear notificación
        await Promise.all([
            libro.update({
                copias: libro.copias - 1,
                disponible: libro.copias > 1
            }),
            Notificacion.create({
                usuarioId: usuarioId,
                tipo: 'prestamo',
                mensaje: `¡Has tomado prestado el libro: ${libro.titulo}!`,
                referencia: {
                    tipo: 'prestamo',
                    id: prestamo.id
                }
            }),
            actualizarEstadisticas(libroId)
        ]);

        // Obtener préstamo con datos del libro
        const prestamoConLibro = await Prestamo.findByPk(prestamo.id, {
            include: [{
                model: Libro,
                attributes: ['titulo', 'autor', 'portada']
            }]
        });

        res.status(201).json({
            success: true,
            data: prestamoConLibro,
            message: '¡Préstamo realizado exitosamente!'
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Error al crear el préstamo',
            error: error.message
        });
    }
};

// ¡Registrar devolución de libro!
const registrarDevolucion = async (req, res) => {
    try {
        const prestamo = await Prestamo.findByPk(req.params.id, {
            include: [{ model: Libro }]
        });

        if (!prestamo) {
            return res.status(404).json({
                success: false,
                message: 'Préstamo no encontrado'
            });
        }

        // Actualizar préstamo y libro
        await Promise.all([
            prestamo.update({
                estado: 'devuelto',
                devuelto: true
            }),
            prestamo.Libro.update({
                copias: prestamo.Libro.copias + 1,
                disponible: true
            }),
            Notificacion.create({
                usuarioId: prestamo.usuarioId,
                tipo: 'devolucion',
                mensaje: '¡Libro devuelto exitosamente!',
                referencia: {
                    tipo: 'prestamo',
                    id: prestamo.id
                }
            })
        ]);

        res.status(200).json({
            success: true,
            message: '¡Libro devuelto exitosamente!'
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Error al registrar la devolución',
            error: error.message
        });
    }
};

module.exports = {
    crearPrestamo,
    registrarDevolucion,
    obtenerPrestamosUsuario,
    extenderPrestamo
};