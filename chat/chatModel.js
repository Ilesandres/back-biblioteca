const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Chat = sequelize.define('Chat', {
    tipo: {
        type: DataTypes.ENUM('soporte', 'general'),
        defaultValue: 'soporte'
    },
    estado: {
        type: DataTypes.ENUM('activo', 'cerrado'),
        defaultValue: 'activo'
    },
    ultimoMensaje: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    }
});

module.exports = Chat; 