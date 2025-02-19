const { Libro, Resena, Usuario } = require('../models');
const { Op } = require('sequelize');
const { cloudinary } = require('../config/cloudinary');

// Obtener todos los libros
const obtenerLibros = async (req, res) => {
    try {
        const libros = await Libro.findAll({
            include: [{
                model: Resena,
                attributes: ['calificacion']
            }]
        });
        res.json({
            success: true,
            data: libros
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error al obtener los libros',
            error: error.message
        });
    }
};

// Obtener un libro por ID
const obtenerLibroPorId = async (req, res) => {
    try {
        const libro = await Libro.findByPk(req.params.id, {
            include: [{
                model: Resena,
                attributes: ['calificacion', 'comentario', 'createdAt'],
                include: [{
                    model: Usuario,
                    attributes: ['nombre']
                }]
            }],
            attributes: {
                include: ['titulo', 'autor', 'descripcion', 'genero', 'fechaPublicacion', 'portada', 'disponible', 'copias']
            }
        });
        if (!libro) {
            return res.status(404).json({
                success: false,
                message: 'Libro no encontrado'
            });
        }
        res.json({
            success: true,
            data: libro
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error al obtener el libro',
            error: error.message
        });
    }
};

// Crear un nuevo libro
const crearLibro = async (req, res) => {
    console.log('Ejecutando crearLibro controller');
    console.log('Request body recibido:', req.body);
    try {
        let libroData = req.body;

        // Si hay un archivo de portada, procesar la subida
        if (req.file) {
            console.log('Archivo de portada detectado:', req.file.path);
            libroData.portada = req.file.path;
        }

        const nuevoLibro = await Libro.create(libroData);
        console.log('Libro creado exitosamente:', nuevoLibro.toJSON());
        res.status(201).json({
            success: true,
            data: nuevoLibro,
            message: '¡Libro agregado exitosamente!'
        });
    } catch (error) {
        console.error('Error al crear libro:', error);
        res.status(400).json({
            success: false,
            message: 'Error al crear el libro',
            error: error.message
        });
    }
};

// Actualizar un libro
const actualizarLibro = async (req, res) => {
    try {
        const libro = await Libro.findByPk(req.params.id);
        if (!libro) {
            return res.status(404).json({
                success: false,
                message: 'Libro no encontrado'
            });
        }

        const updatedData = { ...req.body };
        // Solo procesar la portada si se subió una nueva imagen
        if (req.file) {
            console.log('Nueva imagen de portada detectada');
            // Si hay una portada existente, eliminarla de Cloudinary
            if (libro.portada) {
                console.log('Eliminando portada anterior de Cloudinary');
                const publicId = libro.portada.split('/').pop().split('.')[0];
                await cloudinary.uploader.destroy(`book-covers/${publicId}`);
            }
            updatedData.portada = req.file.path;
            console.log('Nueva portada establecida:', req.file.path);
        } else {
            console.log('No se detectó nueva imagen, manteniendo la portada existente');
            // No modificar el campo portada si no hay nueva imagen
            delete updatedData.portada;
        }

        await libro.update(updatedData);

        const updatedLibro = await Libro.findByPk(req.params.id, {
            include: [{
                model: Resena,
                attributes: ['calificacion']
            }]
        });

        res.json({
            success: true,
            data: updatedLibro,
            message: '¡Libro actualizado exitosamente!'
        });
    } catch (error) {
        console.error('Error al actualizar libro:', error);
        res.status(400).json({
            success: false,
            message: 'Error al actualizar el libro',
            error: error.message
        });
    }
};

// Eliminar un libro
const eliminarLibro = async (req, res) => {
    try {
        const libro = await Libro.findByPk(req.params.id, {
            include: [{
                model: Resena,
                attributes: ['calificacion']
            }]
        });
        if (!libro) {
            return res.status(404).json({
                success: false,
                message: 'Libro no encontrado'
            });
        }

        // Eliminar la imagen de Cloudinary si existe
        if (libro.portada) {
            const publicId = libro.portada.split('/').pop().split('.')[0];
            await cloudinary.uploader.destroy(`book-covers/${publicId}`);
        }

        await libro.destroy();
        res.json({
            success: true,
            message: '¡Libro eliminado exitosamente!'
        });
    } catch (error) {
        console.error('Error al eliminar libro:', error);
        res.status(500).json({
            success: false,
            message: 'Error al eliminar el libro',
            error: error.message
        });
    }
};

// Buscar libros
const buscarLibros = async (req, res) => {
    try {
        const { q, genero, page = 1, limit = 10 } = req.query;
        const offset = (page - 1) * limit;
        
        let where = {};
        
        if (q) {
            where = {
                [Op.or]: [
                    { titulo: { [Op.like]: `%${q}%` } },
                    { autor: { [Op.like]: `%${q}%` } },
                    { descripcion: { [Op.like]: `%${q}%` } }
                ]
            };
        }

        if (genero) {
            where.genero = genero;
        }

        const { count, rows: libros } = await Libro.findAndCountAll({
            where,
            limit: parseInt(limit),
            offset,
            include: [{
                model: Resena,
                attributes: ['calificacion']
            }]
        });

        res.json({
            success: true,
            data: libros,
            pagination: {
                total: count,
                page: parseInt(page),
                pages: Math.ceil(count / limit)
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error al buscar libros',
            error: error.message
        });
    }
};

// Actualizar portada del libro
const actualizarPortada = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No se ha subido ninguna imagen'
            });
        }

        const libro = await Libro.findByPk(req.params.id);
        if (!libro) {
            return res.status(404).json({
                success: false,
                message: 'Libro no encontrado'
            });
        }

        // Eliminar la imagen anterior de Cloudinary si existe
        if (libro.portada) {
            const publicId = libro.portada.split('/').pop().split('.')[0];
            await cloudinary.uploader.destroy(`book-covers/${publicId}`);
        }

        // Guardar la URL completa de Cloudinary
        await libro.update({ portada: req.file.path });

        const updatedLibro = await Libro.findByPk(req.params.id, {
            include: [{
                model: Resena,
                attributes: ['calificacion']
            }]
        });

        res.json({
            success: true,
            data: updatedLibro,
            message: '¡Portada actualizada exitosamente!'
        });
    } catch (error) {
        console.error('Error al actualizar la portada:', error);
        res.status(400).json({
            success: false,
            message: 'Error al actualizar la portada',
            error: error.message
        });
    }
};

module.exports = {
    obtenerLibros,
    obtenerLibroPorId,
    crearLibro,
    actualizarLibro,
    eliminarLibro,
    buscarLibros,
    actualizarPortada
};