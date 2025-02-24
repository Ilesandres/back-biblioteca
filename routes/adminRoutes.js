const express = require('express');
const router = express.Router();
const { protegerRuta } = require('../middlewares/auth');
const { esAdmin } = require('../middlewares/roles');
const { 
    obtenerUsuarios,
    obtenerEstadisticas,
    toggleBloqueoUsuario,
    eliminarUsuario
} = require('../controllers/adminController');
const { getLibros } = require('../controllers/libroController');

// Ruta para obtener estadísticas generales
router.get('/stats', protegerRuta, esAdmin, obtenerEstadisticas);

// Ruta para obtener todos los usuarios
router.get('/usuarios', protegerRuta, esAdmin, obtenerUsuarios);

// Ruta para obtener todos los libros
router.get('/libros', protegerRuta, esAdmin, getLibros);

// Ruta para bloquear/desbloquear usuario
router.put('/usuarios/:usuario_id/bloquear', protegerRuta, esAdmin, toggleBloqueoUsuario);

// Ruta para eliminar usuario
router.delete('/usuarios/:usuario_id', protegerRuta, esAdmin, eliminarUsuario);

module.exports = router;