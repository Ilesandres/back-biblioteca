const express = require('express');
const bcrypt = require('bcrypt');
const { protegerRuta } = require('../middlewares/auth');
const { validarRegistro } = require('../middlewares/validator');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');
const {
    registrarUsuario,
    loginUsuario,
    obtenerPerfil,
    actualizarPerfil,
    obtenerHistorialPrestamos,
    getStats,
    logoutUsuario
} = require('../controllers/usuarioController');

const router = express.Router();

/**
 * @swagger
 * /usuarios/stats:
 *   get:
 *     summary: Obtiene las estadísticas del usuario
 *     tags: [Usuarios]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Estadísticas obtenidas exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 prestamos:
 *                   type: integer
 *                   example: 5
 *                 librosActivos:
 *                   type: integer
 *                   example: 2
 *       401:
 *         description: No autorizado
 */
router.get('/stats', protegerRuta, getStats);

/**
 * @swagger
 * /usuarios/register:
 *   post:
 *     summary: Registra un nuevo usuario
 *     tags: [Usuarios]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nombre:
 *                 type: string
 *                 example: "johndoe"
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "john@example.com"
 *               password:
 *                 type: string
 *                 example: "password123"
 *     responses:
 *       201:
 *         description: Usuario registrado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                   example: 1
 *                 username:
 *                   type: string
 *                   example: "johndoe"
 *                 email:
 *                   type: string
 *                   example: "john@example.com"
 *       400:
 *         description: Error en los datos de registro
 */

/**
 * @swagger
 * /usuarios/login:
 *   post:
 *     summary: Inicia sesión de usuario
 *     tags: [Usuarios]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "john@example.com"
 *               password:
 *                 type: string
 *                 example: "password123"
 *     responses:
 *       200:
 *         description: Login exitoso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                       example: 1
 *                     username:
 *                       type: string
 *                       example: "johndoe"
 *                     email:
 *                       type: string
 *                       example: "john@example.com"
 *                 token:
 *                   type: string
 *                   example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *       401:
 *         description: Credenciales inválidas
 *       404:
 *         description: Usuario no encontrado
 */

/**
 * @swagger
 * /usuarios/perfil:
 *   get:
 *     summary: Obtiene el perfil del usuario autenticado
 *     tags: [Usuarios]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Perfil obtenido exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                   example: 1
 *                 nombre:
 *                   type: string
 *                   example: "johndoe"
 *                 email:
 *                   type: string
 *                   example: "john@example.com"
 *       401:
 *         description: No autorizado
 */

/**
 * @swagger
 * /usuarios/prestamos:
 *   get:
 *     summary: Obtiene el historial de préstamos del usuario
 *     tags: [Usuarios]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Historial de préstamos obtenido exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                     example: 1
 *                   libroId:
 *                     type: integer
 *                     example: 1
 *                   fechaPrestamo:
 *                     type: string
 *                     format: date-time
 *                   fechaDevolucion:
 *                     type: string
 *                     format: date-time
 *       401:
 *         description: No autorizado
 */

/**
 * @swagger
 * /usuarios/perfil:
 *   put:
 *     summary: Actualiza el perfil del usuario
 *     tags: [Usuarios]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nombre:
 *                 type: string
 *                 example: "johndoe"
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "john1@example.com"
 *               password:
 *                 type: string
 *                 example: "password123"
 *     responses:
 *       200:
 *         description: Perfil actualizado exitosamente
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
 *                   example: "¡Perfil actualizado exitosamente!"
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                       example: 1
 *                     nombre:
 *                       type: string
 *                       example: "johndoe"
 *                     email:
 *                       type: string
 *                       example: "john1@example.com"
 *       400:
 *         description: Error al actualizar perfil
 *       401:
 *         description: No autorizado
 *       404:
 *         description: Usuario no encontrado
 */

router.post('/register', validarRegistro, registrarUsuario);

router.post('/login', loginUsuario);

router.get('/perfil', protegerRuta, obtenerPerfil);
router.put('/perfil', protegerRuta, actualizarPerfil);
router.get('/prestamos', protegerRuta, obtenerHistorialPrestamos);

// Legacy routes for backward compatibility
router.post('/registro', validarRegistro, registrarUsuario);

// Original route implementations
router.post('/register-legacy', async(req,res)=>{
    try {
        const {username,email, password}=req.body;
        
        // Generar hash de la contraseña
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        
        // Crear usuario con la contraseña hasheada
        const user = await Usuario.create({
            nombre: username,
            email,
            password: hashedPassword  // guardamos el hash, no la contraseña en texto plano
        });

        res.status(201).json({
            id: user.id,
            username: user.username,
            email: user.email
        });
    } catch (err) {
        res.status(400).json({error:err.message});
    }
});

router.post('/login', async (req,res)=>{
    const {email,password}= req.body;
    try {
        const user = await Usuario.findOne({where:{email}});
        if(!user) return res.status(404).json({error:'usuario no encontrado'});

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(401).json({error:'contraseña incorrecta'});

        // Generar token JWT
        const token = jwt.sign(
            { id: user.id, email: user.email },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        // Actualizar estado online
        await user.update({ online: true, lastSeen: new Date() });

        res.json({
            user: {
                id: user.id,
                username: user.username,
                email: user.email
            },
            token
        });
    } catch (err) {
        res.status(400).json({error:err.message});
    }
});

// Obtener perfil de usuario
router.get('/profile/:id', async (req, res) => {
    try {
        const user = await Usuario.findByPk(req.params.id, {
            attributes: ['id', 'nombre', 'email'] // excluimos password
        });
        if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });
        res.json(user);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// Actualizar perfil
router.put('/profile/:id', async (req, res) => {
    try {
        const { username, email } = req.body;
        const user = await User.findByPk(req.params.id);
        if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });
        
        await user.update({ username, email });
        res.json({ message: 'Perfil actualizado exitosamente' });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

router.post('/block/:userId', protegerRuta, async (req, res) => {
    try {
        const contact = await Contact.findOne({
            where: {
                userId: req.user.id,
                friendId: req.params.userId
            }
        });
        
        if (contact) {
            await contact.update({ status: 'blocked' });
            res.json({ message: 'Usuario bloqueado' });
        } else {
            await Contact.create({
                userId: req.user.id,
                friendId: req.params.userId,
                status: 'blocked'
            });
            res.json({ message: 'Usuario bloqueado' });
        }
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

router.get('/search', protegerRuta, async (req, res) => {
    try {
        const { q } = req.query;
        if (!q) return res.status(400).json({ error: 'Término de búsqueda requerido' });

        // Buscar usuarios que coincidan con el término de búsqueda
        const users = await Usuario.findAll({
            where: {
                [Op.or]: [
                    { nombre: { [Op.like]: `%${q}%` } },
                    { email: { [Op.like]: `%${q}%` } }
                ],
                // Excluir al usuario actual de los resultados
                id: { [Op.ne]: req.user.id }
            },
            attributes: ['id', 'username', 'email', 'online', 'lastSeen'],
            limit: 10 // Limitar resultados
        });

        res.json(users);
    } catch (err) {
        console.error('Error en búsqueda de usuarios:', err);
        res.status(400).json({ error: err.message });
    }
});

/**
 * @swagger
 * /usuarios/logout:
 *   post:
 *     summary: Cierra la sesión del usuario
 *     tags: [Usuarios]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Sesión cerrada exitosamente
 *       500:
 *         description: Error al cerrar sesión
 */
router.post('/logout', protegerRuta, logoutUsuario);

module.exports = router;