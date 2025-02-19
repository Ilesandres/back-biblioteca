const { Usuario, Prestamo, Resena } = require('../models');
const { Op } = require('sequelize');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// Registrar usuario
const registrarUsuario = async (req, res) => {
    try {
        const { email } = req.body;
        const usuarioExistente = await Usuario.findOne({ where: { email } });

        if (usuarioExistente) {
            return res.status(400).json({
                success: false,
                message: '¡Este email ya está registrado!'
            });
        }

        const usuario = await Usuario.create({
            nombre: req.body.nombre,
            email: req.body.email,
            password: req.body.password,
            rol: req.body.rol || 'usuario'
        });
        
        const token = jwt.sign(
            { id: usuario.id },
            process.env.JWT_SECRET,
            { expiresIn: '1d' }
        );

        res.status(201).json({
            success: true,
            token,
            data: {
                id: usuario.id,
                nombre: usuario.nombre,
                email: usuario.email,
                rol: usuario.rol
            }
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Error al registrar usuario',
            error: error.message
        });
    }
};

// Login usuario
const loginUsuario = async (req, res) => {
    try {
        const { email, password } = req.body;
        const usuario = await Usuario.findOne({
            where: { email },
            attributes: ['id', 'nombre', 'email', 'password', 'rol']
        });

        if (!usuario) {
            return res.status(401).json({
                success: false,
                message: 'Credenciales inválidas'
            });
        }

        const passwordValido = await bcrypt.compare(password, usuario.password);
        if (!passwordValido) {
            return res.status(401).json({
                success: false,
                message: 'Credenciales inválidas'
            });
        }

        const token = jwt.sign(
            { id: usuario.id },
            process.env.JWT_SECRET,
            { expiresIn: '1d' }
        );

        res.json({
            success: true,
            token,
            user: {
                id: usuario.id,
                nombre: usuario.nombre,
                email: usuario.email,
                rol: usuario.rol
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error al iniciar sesión',
            error: error.message
        });
    }
};

// Obtener perfil de usuario
const obtenerPerfil = async (req, res) => {
    try {
        const usuario = await Usuario.findByPk(req.user.id, {
            attributes: { exclude: ['password'] },
            include: [
                {
                    model: Prestamo,
                    include: ['Libro']
                },
                {
                    model: Resena,
                    include: ['Libro']
                }
            ]
        });

        res.json({
            success: true,
            data: usuario
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error al obtener perfil',
            error: error.message
        });
    }
};

// Actualizar perfil del usuario
const actualizarPerfil = async (req, res) => {
    try {
        const usuario = await Usuario.findByPk(req.user.id);
        
        if (!usuario) {
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado'
            });
        }
        
        // No permitir actualizar el rol desde esta ruta
        delete req.body.rol;
        
        await usuario.update(req.body);

        res.json({
            success: true,
            message: '¡Perfil actualizado exitosamente!',
            data: {
                id: usuario.id,
                nombre: usuario.nombre,
                email: usuario.email
            }
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Error al actualizar perfil',
            error: error.message
        });
    }
};

// Obtener historial de préstamos del usuario
const obtenerHistorialPrestamos = async (req, res) => {
    try {
        const prestamos = await Prestamo.findAll({
            where: { usuarioId: req.usuario.id },
            include: [{
                model: Libro,
                attributes: ['titulo', 'autor', 'portada']
            }],
            order: [['fechaPrestamo', 'DESC']]
        });

        res.json({
            success: true,
            data: prestamos
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error al obtener historial',
            error: error.message
        });
    }
};

// Obtener estadísticas del usuario
const getStats = async (req, res) => {
    try {
        const userId = req.user.id;

        // Obtener cantidad de préstamos
        const prestamosCount = await Prestamo.count({
            where: { usuarioId: userId }
        });

        // Obtener cantidad de reseñas
        const resenasCount = await Resena.count({
            where: { usuarioId: userId }
        });

        // Obtener préstamos activos
        const prestamosActivos = await Prestamo.count({
            where: {
                usuarioId: userId,
                estado: 'activo'
            }
        });

        res.json({
            success: true,
            data: {
                totalPrestamos: prestamosCount,
                totalResenas: resenasCount,
                prestamosActivos: prestamosActivos
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error al obtener estadísticas',
            error: error.message
        });
    }
};

module.exports = {
    registrarUsuario,
    loginUsuario,
    obtenerPerfil,
    actualizarPerfil,
    obtenerHistorialPrestamos,
    getStats
};