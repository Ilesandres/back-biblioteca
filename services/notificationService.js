const { Notificacion } = require('../models');
const { io } = require('../config/socket');

class NotificationService {
    static async createNotification(data) {
        try {
            const notification = await Notificacion.create({
                usuarioId: data.usuarioId,
                tipo: data.tipo,
                mensaje: data.mensaje,
                referenciaTipo: data.referenciaTipo,
                referenciaId: data.referenciaId
            });

            // Check if io is initialized before emitting
            if (io) {
                io.to(`user:${data.usuarioId}`).emit('nueva_notificacion', notification);
            } else {
                console.warn('Socket.io not initialized, notification will not be emitted in real-time');
            }

            return notification;
        } catch (error) {
            console.error('Error creating notification:', error);
            throw error;
        }
    }

    static async getUserNotifications(userId) {
        try {
            return await Notificacion.findAll({
                where: { usuarioId: userId },
                order: [['createdAt', 'DESC']]
            });
        } catch (error) {
            console.error('Error fetching notifications:', error);
            throw error;
        }
    }

    static async markAsRead(notificationId, userId) {
        try {
            const notification = await Notificacion.findOne({
                where: { id: notificationId, usuarioId: userId }
            });

            if (!notification) {
                throw new Error('Notification not found');
            }

            await notification.update({ leida: true });
            return notification;
        } catch (error) {
            console.error('Error marking notification as read:', error);
            throw error;
        }
    }
    static async markAllAsRead(userId) {
        try {
            const result = await Notificacion.update(
                { leida: true },
                { where: { usuarioId: userId } }
            );
            return result;
        } catch (error) {
            console.error('Error marking all notifications as read:', error);
            throw error;
        }
    }
}

module.exports = NotificationService;