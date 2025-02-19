const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

/**
 * @swagger
 * components:
 *   schemas:
 *     Libro:
 *       type: object
 *       required:
 *         - titulo
 *         - autor
 *         - descripcion
 *         - genero
 *       properties:
 *         id:
 *           type: integer
 *           description: ID auto-generado del libro
 *         titulo:
 *           type: string
 *           description: Título del libro
 *         autor:
 *           type: string
 *           description: Autor del libro
 *         descripcion:
 *           type: string
 *           description: Descripción del libro
 *         genero:
 *           type: string
 *           description: Género literario
 */
const Libro = sequelize.define('Libro', {
    titulo: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            notEmpty: true
        }
    },
    autor: {
        type: DataTypes.STRING,
        allowNull: false
    },
    descripcion: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    genero: {
        type: DataTypes.STRING,
        allowNull: false
    },
    fechaPublicacion: {
        type: DataTypes.DATE,
        allowNull: true,
        defaultValue: null
    },
    portada: {
        type: DataTypes.STRING,
        defaultValue: 'default-book-cover.jpg'
    },
    disponible: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    },
    copias: {
        type: DataTypes.INTEGER,
        defaultValue: 1
    }
}, {
    timestamps: true
});

module.exports = Libro; 