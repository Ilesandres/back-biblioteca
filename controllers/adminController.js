const pool = require('../config/db');

// Obtener todos los usuarios
const obtenerUsuarios = async (req, res) => {
    try {
        const [usuarios] = await pool.query(
            'SELECT id, nombre, email, createdAt FROM usuario ORDER BY createdAt DESC'
        );
        res.json(usuarios);
    } catch (err) {
        console.error('Error al obtener usuarios:', err);
        res.status(500).json({ error: err.message });
    }
};

// Obtener estadísticas generales
const obtenerEstadisticas = async (req, res) => {
    try {
        // Total de usuarios
        const [usuarios] = await pool.query('SELECT COUNT(*) as total FROM usuario');
        
        // Total de libros
        const [libros] = await pool.query('SELECT COUNT(*) as total FROM libro');
        
        // Total de préstamos activos
        const [prestamosActivos] = await pool.query(
            'SELECT COUNT(*) as total FROM prestamo WHERE fechaDevolucion IS NULL'
        );
        
        // Total de préstamos realizados
        const [prestamosTotal] = await pool.query('SELECT COUNT(*) as total FROM prestamo');

        res.json({
            usuarios: usuarios[0].total,
            libros: libros[0].total,
            prestamosActivos: prestamosActivos[0].total,
            prestamosTotal: prestamosTotal[0].total
        });
    } catch (err) {
        console.error('Error al obtener estadísticas:', err);
        res.status(500).json({ error: err.message });
    }
};

// Bloquear/Desbloquear usuario
const toggleBloqueoUsuario = async (req, res) => {
    try {
        const { usuario_id } = req.params;
        const { bloqueado } = req.body;

        await pool.query(
            'UPDATE usuario SET bloqueado = ? WHERE id = ?',
            [bloqueado, usuario_id]
        );

        res.json({
            message: `Usuario ${bloqueado ? 'bloqueado' : 'desbloqueado'} exitosamente`
        });
    } catch (err) {
        console.error('Error al modificar estado de usuario:', err);
        res.status(500).json({ error: err.message });
    }
};

// Eliminar usuario
const eliminarUsuario = async (req, res) => {
    try {
        const { usuario_id } = req.params;

        // Verificar si el usuario tiene préstamos activos
        const [prestamosActivos] = await pool.query(
            'SELECT COUNT(*) as total FROM prestamo WHERE usuario_id = ? AND fecha_devolucion IS NULL',
            [usuario_id]
        );

        if (prestamosActivos[0].total > 0) {
            return res.status(400).json({
                error: 'No se puede eliminar el usuario porque tiene préstamos activos'
            });
        }

        // Eliminar usuario
        await pool.query('DELETE FROM usuario WHERE id = ?', [usuario_id]);

        res.json({ message: 'Usuario eliminado exitosamente' });
    } catch (err) {
        console.error('Error al eliminar usuario:', err);
        res.status(500).json({ error: err.message });
    }
};

module.exports = {
    obtenerUsuarios,
    obtenerEstadisticas,
    toggleBloqueoUsuario,
    eliminarUsuario
};