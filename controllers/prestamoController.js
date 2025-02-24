const pool = require('../config/db');

// Crear un nuevo préstamo
const crearPrestamo = async (req, res) => {
    try {
        const { libroId, fechaDevolucion } = req.body;
        const libro_id = libroId; 
        const usuario_id = req.user.id;

        const [libro] = await pool.query('SELECT CASE WHEN stock > 0 THEN TRUE ELSE FALSE END as disponible FROM libro WHERE id = ?', [libro_id]);
        
        if (libro.length === 0) {
            return res.status(404).json({ error: 'Libro no encontrado' });
        }

        if (!libro[0].disponible) {
            return res.status(400).json({ error: 'El libro no está disponible' });
        }

        // Crear el préstamo
        const [result] = await pool.query(
            'INSERT INTO prestamo (usuarioId, libroId, fechaPrestamo, fechaDevolucion) VALUES (?, ?, NOW(), ?)',
            [usuario_id, libro_id, fechaDevolucion]
        );

        // Actualizar stock del libro
        await pool.query('UPDATE libro SET stock = stock - 1 WHERE id = ?', [libro_id]);

        res.status(201).json({
            id: result.insertId,
            usuario_id,
            libro_id,
            fecha_prestamo: new Date(),
            fecha_devolucion: fechaDevolucion
        });
    } catch (err) {
        console.error('Error al crear préstamo:', err);
        res.status(400).json({ error: err.message });
    }
};

// Devolver un libro
const devolverLibro = async (req, res) => {
    try {
        const { id } = req.params;
        const estado="devuelto";

        // Verificar que el préstamo existe y pertenece al usuario
        const [prestamo] = await pool.query(
            'SELECT libroId FROM prestamo WHERE id = ? AND usuarioId = ? AND fechaDevolucionReal IS NULL',
            [id, req.user.id]
        );

        if (prestamo.length === 0) {
            return res.status(404).json({ error: 'Préstamo no encontrado o ya devuelto' });
        }

        // Actualizar fecha de devolución
        await pool.query(
            'UPDATE prestamo SET fechaDevolucionReal = NOW(), estado = ?  WHERE id = ?',
            [estado, id]
        );

        // Actualizar stock del libro
        await pool.query(
            'UPDATE libro SET stock = stock + 1 WHERE id = ?',
            [prestamo[0].libroId]
        );

        res.json({ message: 'Libro devuelto exitosamente' });
    } catch (err) {
        console.error('Error al devolver libro:', err);
        res.status(400).json({ error: err.message });
    }
};

// Obtener todos los préstamos activos
const obtenerPrestamosActivos = async (req, res) => {
    try {
        const [prestamos] = await pool.query(
            `SELECT p.id, p.fechaPrestamo, p.fechaDevolucion, 
                    l.titulo as libro_titulo, l.portada as libro_Portada,
                     u.nombre as usuario_nombre
             FROM prestamo p
             JOIN libro l ON p.libroId = l.id
             JOIN usuario u ON p.usuarioId = u.id
             WHERE p.fechaDevolucion IS NULL
             ORDER BY p.fechaPrestamo DESC`
        );

        res.json(prestamos);
    } catch (err) {
        console.error('Error al obtener préstamos activos:', err);
        res.status(400).json({ error: err.message });
    }
};

// Obtener historial de préstamos del usuario autenticado
const obtenerHistorialPrestamos = async (req, res) => {
    try {
        const [prestamos] = await pool.query(
            `SELECT p.id, p.fechaPrestamo, p.fechaDevolucion, p.estado as estado_prestamo,
                    l.titulo as libro_titulo, l.portada as libro_Portada,
                     l.autor as libro_autor, u.nombre as usuario_nombre
             FROM prestamo p
             JOIN libro l ON p.libroId = l.id
             JOIN usuario u ON p.usuarioId = u.id
             WHERE p.usuarioId = ?
             ORDER BY p.fechaPrestamo DESC`,
            [req.user.id]
        );

        res.json(prestamos);
    } catch (err) {
        console.error('Error al obtener historial de préstamos:', err);
        res.status(400).json({ error: err.message });
    }
};

// Obtener todos los préstamos (Admin)
const obtenerTodosPrestamos = async (req, res) => {
    try {
        const [prestamos] = await pool.query(
            `SELECT p.id, p.fechaPrestamo, p.fechaDevolucion, p.estado as estado_prestamo,
                    l.titulo as libro_titulo, l.portada as libro_Portada,
                     l.autor as libro_autor, u.nombre as usuario_nombre
             FROM prestamo p
             JOIN libro l ON p.libroId = l.id
             JOIN usuario u ON p.usuarioId = u.id
             ORDER BY p.fechaPrestamo DESC`
        );

        res.json(prestamos);
    } catch (err) {
        console.error('Error al obtener todos los préstamos:', err);
        res.status(400).json({ error: err.message });
    }
};

// Extender la fecha de devolución de un préstamo
const extenderPrestamo = async (req, res) => {
    try {
        const { id } = req.params;

        // Verificar que el préstamo existe y pertenece al usuario
        const [prestamo] = await pool.query(
            'SELECT * FROM prestamo WHERE id = ? AND usuarioId = ? AND fechaDevolucionReal IS NULL',
            [id, req.user.id]
        );

        if (prestamo.length === 0) {
            return res.status(404).json({ error: 'Préstamo no encontrado o ya devuelto' });
        }

        // Extender la fecha de devolución por 7 días desde la fecha actual
        const nuevaFechaDevolucion = new Date();
        nuevaFechaDevolucion.setDate(nuevaFechaDevolucion.getDate() + 7);

        // Actualizar la fecha de devolución
        await pool.query(
            'UPDATE prestamo SET fechaDevolucion = ? WHERE id = ?',
            [nuevaFechaDevolucion, id]
        );

        res.json({
            message: 'Fecha de devolución extendida exitosamente',
            nueva_fecha_devolucion: nuevaFechaDevolucion
        });
    } catch (err) {
        console.error('Error al extender préstamo:', err);
        res.status(400).json({ error: err.message });
    }
};

module.exports = {
    crearPrestamo,
    devolverLibro,
    obtenerPrestamosActivos,
    obtenerHistorialPrestamos,
    obtenerTodosPrestamos,
    extenderPrestamo
};