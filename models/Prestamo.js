const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

/**
 * @swagger
 * components:
 *   schemas:
 *     Prestamo:
 *       type: object
 *       required:
 *         - libroId
 *         - usuarioId
 *         - fechaDevolucion
 *       properties:
 *         id:
 *           type: integer
 *           description: ID auto-generado del préstamo
 *         estado:
 *           type: string
 *           enum: [activo, devuelto, atrasado]
 *           description: Estado actual del préstamo
 *         fechaPrestamo:
 *           type: string
 *           format: date-time
 *           description: Fecha en que se realizó el préstamo
 */
const Prestamo = sequelize.define('Prestamo', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    libroId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'Libros',
            key: 'id'
        }
    },
    usuarioId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'Usuarios',
            key: 'id'
        }
    },

    estado: {
        type: DataTypes.ENUM('activo', 'devuelto', 'atrasado'),
        defaultValue: 'activo'
    },
    fechaPrestamo: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    },
    fechaDevolucion: {
        type: DataTypes.DATE,
        allowNull: false
    },
    devuelto: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    }
});

// Definir las relaciones
Prestamo.associate = (models) => {
    Prestamo.belongsTo(models.Libro, {
        foreignKey: 'libroId',
        as: 'libro'
    });
    Prestamo.belongsTo(models.Usuario, {
        foreignKey: 'usuarioId',
        as: 'usuario'
    });
};

module.exports = Prestamo;