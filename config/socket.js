const socketIO = require('socket.io');
const jwt = require('jsonwebtoken');
const { Chat, Mensaje, Usuario } = require('../models');

let io;

const initializeSocket = (server) => {
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
        // Unir al usuario a su sala personal para notificaciones
        socket.join(`user:${socket.userId}`);
        
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
                socket.emit('error_chat', { message: error.message });
            }
        });

        // Manejar desconexión
        socket.on('disconnect', () => {
            socket.leave(`user:${socket.userId}`);
        });

        // Manejar marcado de mensajes como leídos
        socket.on('marcar_leido', async (data) => {
            try {
                const { chatId } = data;
                const chat = await Chat.findByPk(chatId);
                
                if (chat) {
                    io.to(`chat:${chatId}`).emit('mensajes_leidos', {
                        chatId,
                        usuarioId: socket.userId
                    });
                }
            } catch (error) {
                socket.emit('error_chat', { message: error.message });
            }
        });
    });

    return io;
};

const enviarNotificacion = (userId, notificacion) => {
    if (io) {
        io.to(`user:${userId}`).emit('nueva_notificacion', notificacion);
    }
};

const enviarNotificacionAdmin = (notificacion) => {
    if (io) {
        io.to('admin').emit('notificacion_admin', notificacion);
    }
};

const guardarMensajeChat = async (data) => {
    const { chatId, contenido, usuarioId } = data;
    
    const mensaje = await Mensaje.create({
        chatId,
        usuarioId,
        contenido
    });

    await Chat.update(
        { ultimoMensaje: new Date() },
        { where: { id: chatId } }
    );

    return mensaje;
};

module.exports = {
    initializeSocket,
    enviarNotificacion,
    enviarNotificacionAdmin
}; 