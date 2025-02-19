const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

/**
 * @swagger
 * components:
 *   schemas:
 *     Resena:
 *       type: object
 *       required:
 *         - libroId
 *         - usuarioId
 *         - calificacion
 *         - comentario
 *       properties:
 *         id:
 *           type: integer
 *           description: ID auto-generado de la reseña
 *         calificacion:
 *           type: integer
 *           minimum: 1
 *           maximum: 5
 *           description: Calificación del libro (1-5)
 */
const Resena = sequelize.define('Resena', {
    calificacion: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
            min: 1,
            max: 5
        }
    },
    comentario: {
        type: DataTypes.TEXT,
        allowNull: false,
        validate: {
            len: [10, 1000]
        }
    }
}, {
    timestamps: true
});

module.exports = Resena; 