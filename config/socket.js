const socketIO = require('socket.io');
const jwt = require('jsonwebtoken');
const db = require('./db');

let io = null;

const initializeSocket = (server) => {
    if (!io) {
        io = socketIO(server, {
            cors: {
                origin: process.env.FRONTEND_URL || "http://localhost:3000",
                methods: ["GET", "POST"]
            }
        }); 

        // Autenticación de WebSocket
        io.use(async (socket, next) => {
            try {
                const token = socket.handshake.auth.token;
                if (!token) {
                    return next(new Error('Autenticación requerida'));
                }
                
                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                socket.userId = decoded.id;
                next();
            } catch (error) {
                next(new Error('Token inválido'));
            }
        });

        io.on('connection', (socket) => {
            console.log(`Usuario ${socket.userId} conectado`);
            // Unir al usuario a su sala personal para notificaciones
            socket.join(`user:${socket.userId}`);
            
            // Enviar notificaciones pendientes al usuario
            enviarNotificacionesPendientes(socket.userId);
            
            // Unir al admin a la sala de administración
            if (socket.handshake.auth.isAdmin) {
                socket.join('admin');
            }

            // Manejar mensajes de chat
            socket.on('mensaje_chat', async (data) => {
                try {
                    const mensaje = await guardarMensajeChat(data);
                    io.to(data.chatId).emit('nuevo_mensaje', mensaje);
                } catch (error) {
                    console.error('Error al guardar mensaje:', error);
                    socket.emit('error_chat', { message: 'Error al enviar mensaje' });
                }
            });

            socket.on('disconnect', () => {
                console.log(`Usuario ${socket.userId} desconectado`);
            });
        });
    }
    return io;
};

// Función para guardar mensaje en la base de datos
async function guardarMensajeChat(data) {
    const { chatId, contenido, usuarioId } = data;
    const [result] = await db.query(
        'INSERT INTO mensaje (chatId, contenido, usuarioId) VALUES (?, ?, ?)',
        [chatId, contenido, usuarioId]
    );
    
    const [mensaje] = await db.query(
        'SELECT m.*, u.nombre as nombreUsuario FROM mensaje m JOIN usuario u ON m.usuarioId = u.id WHERE m.id = ?',
        [result.insertId]
    );
    
    return mensaje[0];
}

// Función para enviar notificaciones pendientes
async function enviarNotificacionesPendientes(userId) {
    try {
        const [notificaciones] = await db.query(
            'SELECT * FROM notificacion WHERE usuarioId = ? AND leida = false',
            [userId]
        );
        
        if (notificaciones.length > 0) {
            io.to(`user:${userId}`).emit('notificaciones_pendientes', notificaciones);
        }
    } catch (error) {
        console.error('Error al enviar notificaciones pendientes:', error);
    }
}

module.exports = { initializeSocket };