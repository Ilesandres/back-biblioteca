const sequelize = require('../config/database');
const Libro = require('./Libro');
const Usuario = require('./Usuario');
const Prestamo = require('./Prestamo');
const Resena = require('./Resena');
const Estadistica = require('./Estadistica');
const Notificacion = require('./Notificacion');

// Relaciones
Libro.hasMany(Resena);
Resena.belongsTo(Libro);

Usuario.hasMany(Resena);
Resena.belongsTo(Usuario);

// Relación Usuario-Notificacion
Usuario.hasMany(Notificacion, {
    foreignKey: 'usuarioId'
});
Notificacion.belongsTo(Usuario, {
    foreignKey: 'usuarioId'
});

// Asegurar que un usuario solo pueda dejar una reseña por libro
Resena.addHook('beforeValidate', async (resena) => {
    const existente = await Resena.findOne({
        where: {
            libroId: resena.libroId,
            usuarioId: resena.usuarioId
        }
    });
    if (existente && !resena.id) {
        throw new Error('Ya has reseñado este libro');
    }
});

// Relaciones de Préstamos
Libro.hasMany(Prestamo, {
    foreignKey: 'libroId'
});
Prestamo.belongsTo(Libro, {
    foreignKey: 'libroId'
});

Usuario.hasMany(Prestamo, {
    foreignKey: 'usuarioId'
});
Prestamo.belongsTo(Usuario, {
    foreignKey: 'usuarioId'
});

// Relaciones adicionales
Libro.hasOne(Estadistica, {
    foreignKey: {
        name: 'libroId',
        allowNull: false
    }
});
Estadistica.belongsTo(Libro, {
    foreignKey: {
        name: 'libroId',
        allowNull: false
    }
});

// Sincronizar modelos sin alterar la base de datos
sequelize.sync().then(() => {
    console.log('Base de datos sincronizada');
});

module.exports = {
    sequelize,
    Libro,
    Usuario,
    Prestamo,
    Resena,
    Estadistica,
    Notificacion
};