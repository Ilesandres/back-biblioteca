const db = require('../config/db');
const moment = require('moment-timezone');
const { cloudinary, BOOK_COVERS_FOLDER } = require('../config/cloudinary');

const libroController = {
    buscarLibros: async (req, res) => {
        try {
            const { query } = req.query;
            const searchQuery = `
                SELECT l.*, 
                    GROUP_CONCAT(c.nombre) as categorias,
                    CASE WHEN l.stock > 0 THEN TRUE ELSE FALSE END as disponible,
                    (SELECT COUNT(*) FROM resena r WHERE r.libroId = l.id) as total_resenas
                FROM libro l
                LEFT JOIN librocategoria lc ON l.id = lc.libroId
                LEFT JOIN categoria c ON lc.categoriaId = c.id
                WHERE l.titulo LIKE ? OR l.autor LIKE ?
                GROUP BY l.id
            `;
            const searchTerm = `%${query}%`;
            const [libros] = await db.query(searchQuery, [searchTerm, searchTerm]);
            res.json(libros);
        } catch (error) {
            console.error('Error al buscar libros:', error);
            res.status(500).send('Error al buscar libros');
        }
    },
    
    updateLibro: async (req, res) => {
        console.log('Iniciando actualización de libro');
        console.log('Headers:', req.headers);
        console.log('Body:', req.body);
        console.log('File:', req.file);

        let connection;
        try {
            if (!req.body || Object.keys(req.body).length === 0) {
                console.log('Error: No se recibieron datos en el body o está vacío');
                return res.status(400).json({
                    success: false,
                    message: 'No se proporcionaron datos para actualizar'
                });
            }

            connection = await db.getConnection();
            await connection.beginTransaction();

            const { titulo, autor, isbn, descripcion, genero, anioPublicacion, copias, editorial } = req.body;
            console.log('Datos extraídos del body:', { titulo, autor, isbn, descripcion, genero, anioPublicacion, copias, editorial });

            const fechaPublicacion = anioPublicacion;
            const idLibro = req.params.id;
            const fecha_Act = moment().tz('America/Bogota').format('YYYY-MM-DD HH:mm:ss');
            let categorias = genero;

            // Input validation with detailed error message
            const requiredFields = { titulo, autor, isbn, descripcion, fechaPublicacion, copias, editorial };
            const missingFields = Object.entries(requiredFields)
                .filter(([_, value]) => !value)
                .map(([field]) => field);

            if (missingFields.length > 0) {
                await connection.rollback();
                return res.status(400).json({
                    success: false,
                    message: `Los siguientes campos son requeridos: ${missingFields.join(', ')}`
                });
            }

            // Input validation
            if (!titulo || !autor || !isbn || !descripcion || !fechaPublicacion || !copias || !editorial) {
                await connection.rollback();
                return res.status(400).json({
                    success: false,
                    message: 'Todos los campos son requeridos'
                });
            }

            // Verify book existence
            const [existingBooks] = await connection.query('SELECT * FROM libro WHERE id = ?', [idLibro]);
            
            if (!existingBooks || existingBooks.length === 0) {
                await connection.rollback();
                return res.status(404).json({
                    success: false,
                    message: 'Libro no encontrado'
                });
            }

            const existingBook = existingBooks[0];
            let portadaUrl = existingBook.portada;

            // Handle image upload if new image is provided
            if (req.file) {
                try {
                    if (existingBook.portada && existingBook.portada.includes('cloudinary.com')) {
                        const publicId = `${BOOK_COVERS_FOLDER}/${existingBook.portada.split('/').pop().split('.')[0]}`;
                        try {
                            await cloudinary.uploader.destroy(publicId);
                        } catch (deleteError) {
                            console.error('Error deleting old image:', deleteError);
                        }
                    }
                    // The image is already uploaded to Cloudinary by the uploadBookCover middleware
                    portadaUrl = req.file.path;
                } catch (error) {
                    await connection.rollback();
                    console.error('Error handling image:', error);
                    return res.status(500).json({
                        success: false,
                        message: 'Error al procesar la imagen'
                    });
                }
            }

            // Update libro information
            const updateLibroQuery = 'UPDATE libro SET titulo = ?, autor = ?, stock = ?, isbn = ?, anioPublicacion = ?, descripcion = ?, updatedAt = ?, portada = ?, editorial = ? WHERE id = ?';
            const [updateResult] = await connection.query(updateLibroQuery, [
                titulo,
                autor,
                copias,
                isbn,
                fechaPublicacion,
                descripcion,
                fecha_Act,
                portadaUrl,
                editorial,
                idLibro
            ]);

            if (updateResult.affectedRows === 0) {
                throw new Error('No se pudo actualizar el libro');
            }

            // Update categories if provided
            if (categorias) {
                const categoriasArray = Array.isArray(categorias) ? categorias : categorias.split(',');
                
                if (categoriasArray.length > 0) {
                    await connection.query('DELETE FROM librocategoria WHERE libroId = ?', [idLibro]);
                    const categoriaValues = categoriasArray.map(categoriaId => [idLibro, categoriaId]);
                    await connection.query('INSERT INTO librocategoria (libroId, categoriaId) VALUES ?', [categoriaValues]);
                }
            }

            await connection.commit();

            // Get updated book data
            const [updatedBook] = await connection.query(`
                SELECT l.*, GROUP_CONCAT(c.nombre) as categorias
                FROM libro l
                LEFT JOIN librocategoria lc ON l.id = lc.libroId
                LEFT JOIN categoria c ON lc.categoriaId = c.id
                WHERE l.id = ?
                GROUP BY l.id
            `, [idLibro]);

            res.status(200).json({
                success: true,
                message: 'Libro actualizado con éxito',
                data: updatedBook[0]
            });

        } catch (error) {
            if (connection) {
                await connection.rollback();
            }
            console.error('Error en la operación del libro:', error);
            res.status(500).json({
                success: false,
                message: 'Error al procesar la operación del libro',
                error: error.message
            });
        } finally {
            if (connection) {
                connection.release();
            }
        }
    },

    getLibros: async (req, res) => {
        try {
            const query = `
                SELECT l.*, 
                    GROUP_CONCAT(c.nombre) as categorias,
                    CASE WHEN l.stock > 0 THEN TRUE ELSE FALSE END as disponible
                FROM libro l
                LEFT JOIN librocategoria lc ON l.id = lc.libroId
                LEFT JOIN categoria c ON lc.categoriaId = c.id
                GROUP BY l.id
            `;
            const [libros] = await db.query(query);
            res.json(libros);
        } catch (error) {
            console.error('Error al obtener libros:', error);
            res.status(500).send('Error al obtener los libros');
        }
    },

    getLibroById: async (req, res) => {
        try {
            const { id } = req.params;
            const query = `
                SELECT l.*, 
                    GROUP_CONCAT(c.nombre) as categorias,
                    GROUP_CONCAT(c.id) as categoriaIds,
                    CASE WHEN l.stock > 0 THEN TRUE ELSE FALSE END as disponible,
                    (SELECT COUNT(*) FROM resena r WHERE r.libroId = l.id) as total_resenas
                FROM libro l
                LEFT JOIN librocategoria lc ON l.id = lc.libroId
                LEFT JOIN categoria c ON lc.categoriaId = c.id
                WHERE l.id = ?
                GROUP BY l.id
            `;
            const [libro] = await db.query(query, [id]);
            if (libro.length === 0) {
                return res.status(404).send('Libro no encontrado');
            }
            res.json(libro[0]);
        } catch (error) {
            console.error('Error al obtener libro:', error);
            res.status(500).send('Error al obtener el libro');
        }
    },

    crearLibro: async (req, res) => {
        console.log('Request body:', req.body);
        console.log('File object:', req.file);
        console.log('Headers:', req.headers);
        console.log('Content-Type:', req.headers['content-type']);
        
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No se proporcionó la imagen de portada'
            });
        }

        let connection;
        try {
            const { titulo, autor, isbn, descripcion, genero, anioPublicacion, copias, editorial } = req.body;
            const fechaPublicacion = anioPublicacion;
            let categorias = genero;

            // Input validation
            if (!titulo || !autor || !isbn || !descripcion || !fechaPublicacion || !copias || !editorial) {
                return res.status(400).json({
                    success: false,
                    message: 'Todos los campos son requeridos'
                });
            }

            // Ensure categorias is an array
            if (categorias && !Array.isArray(categorias)) {
                categorias = [categorias];
            }

            // Get connection and start transaction
            connection = await db.getConnection();
            await connection.beginTransaction();

            // Handle image upload
            let portadaUrl = null;
            if (req.file) {
                // The file should already be uploaded to Cloudinary by uploadBookCover middleware
                if (!req.file.path) {
                    throw new Error('Error al procesar la imagen: URL no disponible');
                }
                portadaUrl = req.file.path;
                console.log('Imagen subida a Cloudinary:', portadaUrl);
            }

            // Insert new book
            const insertLibroQuery = `
                INSERT INTO libro (titulo, autor, stock, isbn, anioPublicacion, descripcion, portada, editorial, createdAt, updatedAt)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
            `;

            const [result] = await connection.query(insertLibroQuery, [
                titulo,
                autor,
                copias,
                isbn,
                fechaPublicacion,
                descripcion,
                portadaUrl,
                editorial
            ]);

            // Insert book categories if provided
            if (categorias && categorias.length > 0) {
                const insertCategoriaQuery = `INSERT INTO librocategoria (libroId, categoriaId) VALUES (?, ?)`;
                const insertPromises = categorias.map(categoriaId => 
                    connection.query(insertCategoriaQuery, [result.insertId, categoriaId])
                );
                await Promise.all(insertPromises);
            }

            // Commit transaction
            await connection.commit();

            // Get the created book with categories
            const [newBook] = await connection.query(`
                SELECT l.*, GROUP_CONCAT(c.nombre) as categorias
                FROM libro l
                LEFT JOIN librocategoria lc ON l.id = lc.libroId
                LEFT JOIN categoria c ON lc.categoriaId = c.id
                WHERE l.id = ?
                GROUP BY l.id
            `, [result.insertId]);

            res.status(201).json({
                success: true,
                data: newBook[0],
                message: '¡Libro creado exitosamente!'
            });

        } catch (error) {
            console.error('Error al crear libro:', error);
            res.status(500).json({
                success: false,
                message: 'Error al crear el libro',
                error: error.message
            });
        }
    },

    eliminarLibro: async (req, res) => {
        try {
            const { id } = req.params;

            // First get the book to check if it exists and get the cover URL
            const [libro] = await db.query('SELECT * FROM libro WHERE id = ?', [id]);
            
            if (libro.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Libro no encontrado'
                });
            }

            // If the book has a cover image in Cloudinary, delete it
            if (libro[0].portada && libro[0].portada.includes('cloudinary.com')) {
                const publicId = `${BOOK_COVERS_FOLDER}/${libro[0].portada.split('/').pop().split('.')[0]}`;
                try {
                    await cloudinary.uploader.destroy(publicId);
                    console.log('Image deleted successfully from Cloudinary');
                } catch (deleteError) {
                    console.error('Error deleting image from Cloudinary:', deleteError);
                }
            }

            // Delete the book from the database
            await db.query('DELETE FROM libro WHERE id = ?', [id]);

            res.json({
                success: true,
                message: '¡Libro eliminado exitosamente!'
            });

        } catch (error) {
            console.error('Error al eliminar libro:', error);
            res.status(500).json({
                success: false,
                message: 'Error al eliminar el libro',
                error: error.message
            });
        }
    },

    actualizarPortada : async (req, res) => {
        try {
            const { id } = req.params;

            if (!req.file) {
                return res.status(400).json({
                    success: false,
                    message: 'No se proporcionó ninguna imagen'
                });
            }

            // First get the book to check if it exists and get the old cover URL
            const [libro] = await db.query('SELECT * FROM libro WHERE id = ?', [id]);
            
            if (libro.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Libro no encontrado'
                });
            }

            // If the book has an existing cover image in Cloudinary, delete it
            if (libro[0].portada && libro[0].portada.includes('cloudinary.com')) {
                const publicId = `${BOOK_COVERS_FOLDER}/${libro[0].portada.split('/').pop().split('.')[0]}`;
                try {
                    await cloudinary.uploader.destroy(publicId);
                    console.log('Image deleted successfully from Cloudinary');
                } catch (deleteError) {
                    console.error('Error deleting image from Cloudinary:', deleteError);
                }
            }

            // The image is already uploaded by the uploadBookCover middleware
            const portadaUrl = req.file.path;

            // Update the book cover URL in the database
            await db.query('UPDATE libro SET portada = ?, updatedAt = NOW() WHERE id = ?', [portadaUrl, id]);

            res.json({
                success: true,
                message: '¡Portada actualizada exitosamente!',
                data: { portada: portadaUrl }
            });

        } catch (error) {
            console.error('Error al actualizar portada:', error);
            res.status(500).json({
                success: false,
                message: 'Error al actualizar la portada',
                error: error.message
            });
        }
    }
}

module.exports = libroController;