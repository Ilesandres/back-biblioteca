const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Estadistica = sequelize.define('Estadistica', {
    vecesPrestado: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    calificacionPromedio: {
        type: DataTypes.FLOAT,
        defaultValue: 0
    },
    numeroResenas: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    ultimoPrestamo: {
        type: DataTypes.DATE,
        allowNull: true
    }
}, {
    timestamps: true
});

module.exports = Estadistica; 