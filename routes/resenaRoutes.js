const express = require('express');
const router = express.Router();
const { protegerRuta } = require('../middlewares/auth');
const {
    crearResena,
    obtenerResenasLibro
} = require('../controllers/resenaController');

router.post('/', protegerRuta, crearResena);
router.get('/libro/:libroId', obtenerResenasLibro);

module.exports = router; 