const express = require("express"); 
const cors = require("cors");
const { createServer } = require('http');
const { initializeSocket } = require('./config/socket');
const { sequelize } = require('./models');
const errorHandler = require('./middlewares/errorHandler');
const { swaggerSpec, swaggerUi } = require('./config/swagger');

const libroRoutes = require('./routes/libroRoutes');
const usuarioRoutes = require('./routes/usuarioRoutes');
const prestamoRoutes = require('./routes/prestamoRoutes');
const resenaRoutes = require('./routes/resenaRoutes');
const adminRoutes = require('./routes/adminRoutes');
const chatRoutes = require('./routes/chatRoutes');
const notificacionRoutes = require('./routes/notificacionRoutes');

const app = express();
const httpServer = createServer(app);
const io = initializeSocket(httpServer);

// Middleware
app.use(cors());
app.use(express.json());

// Documentación Swagger
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Rutas
app.use('/api/libros', libroRoutes);
app.use('/api/usuarios', usuarioRoutes);
app.use('/api/prestamos', prestamoRoutes);
app.use('/api/resenas', resenaRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/notificaciones', notificacionRoutes);

// Middleware de manejo de errores
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

// Sincronizar modelos con la base de datos
sequelize.sync({ alter: true }).then(() => {
    httpServer.listen(PORT, () => {
        console.log(`¡Servidor corriendo en http://localhost:${PORT}!`);
        console.log(`Documentación disponible en http://localhost:${PORT}/api-docs`);
    });
}).catch(error => {
    console.error('Error al sincronizar la base de datos:', error);
});
