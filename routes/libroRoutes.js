const express = require('express');
const router = express.Router();
const { uploadBookCover } = require('../config/cloudinary');
const {
    obtenerLibros,
    obtenerLibroPorId,
    crearLibro,
    actualizarLibro,
    eliminarLibro,
    buscarLibros,
    actualizarPortada
} = require('../controllers/libroController');

/**
 * @swagger
 * /libros:
 *   get:
 *     summary: Obtener todos los libros
 *     tags: [Libros]
 *     responses:
 *       200:
 *         description: Lista de libros obtenida exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Libro'
 */
router.get('/', obtenerLibros);
router.get('/buscar', buscarLibros);

/**
 * @swagger
 * /libros:
 *   post:
 *     summary: Crear un nuevo libro
 *     tags: [Libros]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - titulo
 *               - autor
 *               - descripcion
 *               - genero
 *             properties:
 *               titulo:
 *                 type: string
 *                 description: Título del libro
 *               autor:
 *                 type: string
 *                 description: Autor del libro
 *               descripcion:
 *                 type: string
 *                 description: Descripción del libro
 *               genero:
 *                 type: string
 *                 description: Género literario del libro
 *               fechaPublicacion:
 *                 type: string
 *                 format: date
 *                 description: Fecha de publicación del libro
 *               copias:
 *                 type: integer
 *                 description: Número de copias disponibles
 *                 default: 1
 *               portada:
 *                 type: string
 *                 format: binary
 *                 description: Imagen de portada del libro
 *     responses:
 *       201:
 *         description: Libro creado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Libro'
 *       400:
 *         description: Datos inválidos en la solicitud
 *       500:
 *         description: Error del servidor
 */
router.post('/', uploadBookCover.single('portada'), crearLibro);

/**
 * @swagger
 * /libros/{id}:
 *   get:
 *     summary: Obtener un libro por ID
 *     tags: [Libros]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID del libro
 *     responses:
 *       200:
 *         description: Libro encontrado exitosamente
 *       404:
 *         description: Libro no encontrado
 */
router.get('/:id', obtenerLibroPorId);
/**
 * @swagger
 * /libros/{id}:
 *   put:
 *     summary: Actualizar un libro existente
 *     tags: [Libros]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del libro a actualizar
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               titulo:
 *                 type: string
 *                 description: Título del libro
 *               autor:
 *                 type: string
 *                 description: Autor del libro
 *               descripcion:
 *                 type: string
 *                 description: Descripción del libro
 *               genero:
 *                 type: string
 *                 description: Género literario del libro
 *               fechaPublicacion:
 *                 type: string
 *                 format: date
 *                 description: Fecha de publicación del libro
 *               copias:
 *                 type: integer
 *                 description: Número de copias disponibles
 *               portada:
 *                 type: string
 *                 format: binary
 *                 description: Nueva imagen de portada del libro
 *     consumes:
 *       - multipart/form-data
 *     responses:
 *       200:
 *         description: Libro actualizado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Libro'
 *                 message:
 *                   type: string
 *       400:
 *         description: Datos inválidos en la solicitud
 *       404:
 *         description: Libro no encontrado
 *       500:
 *         description: Error del servidor
 */
router.put('/:id', uploadBookCover.single('portada'), actualizarLibro);

/**
 * @swagger
 * /libros/{id}:
 *   delete:
 *     summary: Eliminar un libro por ID
 *     description: Elimina un libro y su imagen asociada en Cloudinary
 *     tags: [Libros]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID del libro a eliminar
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Libro eliminado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: ¡Libro eliminado exitosamente!
 *       404:
 *         description: Libro no encontrado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Libro no encontrado
 *       500:
 *         description: Error del servidor
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Error al eliminar el libro
 *                 error:
 *                   type: string
 */
router.delete('/:id', eliminarLibro);
router.put('/:id/portada', uploadBookCover.single('portada'), actualizarPortada);
module.exports = router;