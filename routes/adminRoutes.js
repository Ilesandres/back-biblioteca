const express = require('express');
const router = express.Router();
const { protegerRuta } = require('../middlewares/auth');
const { esAdmin } = require('../middlewares/roles');
const { 
    obtenerUsuarios,
    obtenerEstadisticas,
    toggleBloqueoUsuario,
    eliminarUsuario,
    updateUser,
    exportData,
    importData,
    generateTemplate
} = require('../controllers/adminController');
const { getLibros } = require('../controllers/libroController');
const dataService = require('../services/dataService');

// Ruta para obtener estadísticas generales
router.get('/stats', protegerRuta, esAdmin, obtenerEstadisticas);

// Ruta para obtener todos los usuarios
router.get('/usuarios', protegerRuta, esAdmin, obtenerUsuarios);

// Ruta para obtener todos los libros
router.get('/libros', protegerRuta, esAdmin, getLibros);

// Ruta para actualizar usuario
router.put('/usuarios/:id', protegerRuta, esAdmin, updateUser);

// Ruta para bloquear/desbloquear usuario
router.put('/usuarios/:usuario_id/bloquear', protegerRuta, esAdmin, toggleBloqueoUsuario);

// Ruta para eliminar usuario
router.delete('/usuarios/:usuario_id', protegerRuta, esAdmin, eliminarUsuario);

// Rutas para importación/exportación de datos
router.post('/export', protegerRuta, esAdmin, exportData);
router.post('/import', protegerRuta, esAdmin, importData);

// Ruta para generar plantillas
router.get('/template', protegerRuta, esAdmin, generateTemplate);

module.exports = router;