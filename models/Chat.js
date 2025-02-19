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
}, {
    timestamps: true
});

const Mensaje = sequelize.define('Mensaje', {
    contenido: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    leido: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    adjuntos: {
        type: DataTypes.JSON, // Almacenará array de archivos adjuntos
        defaultValue: []
    },
    tipoMensaje: {
        type: DataTypes.ENUM('texto', 'archivo', 'mixto'),
        defaultValue: 'texto'
    }
}, {
    timestamps: true
});

// Relaciones
Chat.hasMany(Mensaje);
Mensaje.belongsTo(Chat);
Mensaje.belongsTo(sequelize.models.Usuario);

module.exports = { Chat, Mensaje }; 