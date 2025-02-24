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
        console.log("Actualizando libro - Datos recibidos:", {
            body: req.body,
            file: req.file ? 'File present' : 'No file'
        });

        try {
            const { titulo, autor, isbn, descripcion, genero, anioPublicacion, copias, stock } = req.body;
            const idLibro = req.params.id;
            const fecha_Act = moment().tz('America/Bogota').format('YYYY-MM-DD HH:mm:ss');
            let categorias = genero;

            // Verify book existence
            const [existingBooks] = await db.query('SELECT * FROM libro WHERE id = ?', [idLibro]);
            
            if (!existingBooks || existingBooks.length === 0) {
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
                    // Delete old cover if exists
                    if (existingBook.portada && existingBook.portada.includes('cloudinary.com')) {
                        const publicId = `${BOOK_COVERS_FOLDER}/${existingBook.portada.split('/').pop().split('.')[0]}`;
                        try {
                            await cloudinary.uploader.destroy(publicId);
                        } catch (deleteError) {
                            console.error('Error deleting old image:', deleteError);
                        }
                    }

                    // Upload new cover with folder specification
                    const result = await cloudinary.uploader.upload(req.file.path, {
                        folder: BOOK_COVERS_FOLDER
                    });
                    portadaUrl = result.secure_url;
                } catch (cloudinaryError) {
                    console.error('Error handling image:', cloudinaryError);
                    return res.status(500).json({
                        success: false,
                        message: 'Error al procesar la imagen'
                    });
                }
            }

            // Begin transaction
            await db.query('START TRANSACTION');

            try {
                // Update libro information
                const updateLibroQuery = 'UPDATE libro SET titulo = ?, autor = ?, stock = ?, isbn = ?, anioPublicacion = ?, descripcion = ?, updatedAt = ?, portada = ? WHERE id = ?';
                const [updateResult] = await db.query(updateLibroQuery, [
                    titulo,
                    autor,
                    copias || stock, // Use copias if available, fallback to stock
                    isbn,
                    anioPublicacion,
                    descripcion,
                    fecha_Act,
                    portadaUrl,
                    idLibro
                ]);

                if (updateResult.affectedRows === 0) {
                    throw new Error('No se pudo actualizar el libro');
                }

                // Update categories
                await db.query('DELETE FROM librocategoria WHERE libroId = ?', [idLibro]);

                if (categorias) {
                    // Ensure categorias is an array
                    const categoriasArray = Array.isArray(categorias) ? categorias : [categorias];
                    
                    if (categoriasArray.length > 0) {
                        const insertCategoriaQuery = 'INSERT INTO librocategoria (libroId, categoriaId) VALUES ?';
                        const categoriaValues = categoriasArray.map(categoriaId => [idLibro, categoriaId]);
                        await db.query(insertCategoriaQuery, [categoriaValues]);
                    }
                }

                // Commit transaction
                await db.query('COMMIT');

                // Get updated book data
                const [updatedBook] = await db.query(`
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

            } catch (transactionError) {
                // Rollback on error
                await db.query('ROLLBACK');
                throw transactionError;
            }

        } catch (error) {
            console.error('Error en la operación del libro:', error);
            res.status(500).json({
                success: false,
                message: 'Error al procesar la operación del libro',
                error: error.message
            });
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
        try {
            const { titulo, autor, isbn, descripcion, genero, fechaPublicacion, copias } = req.body;
            let categorias = genero;
            let portadaUrl = null;

            // Ensure categorias is an array
            if (categorias && !Array.isArray(categorias)) {
                categorias = [categorias];
            }

            // Get the Cloudinary URL from multer middleware
            portadaUrl = req.file ? req.file.path : null;

            // Insert new book
            const insertLibroQuery = `
                INSERT INTO libro (titulo, autor, stock, isbn, anioPublicacion, descripcion, portada, createdAt, updatedAt)
                VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
            `;

            const [result] = await db.query(insertLibroQuery, [
                titulo,
                autor,
                copias,
                isbn,
                fechaPublicacion,
                descripcion,
                portadaUrl
            ]);

            // Insert book categories if provided
            if (categorias && categorias.length > 0) {
                const insertCategoriaQuery = `INSERT INTO librocategoria (libroId, categoriaId) VALUES (?, ?)`;
                const insertPromises = categorias.map(categoriaId => 
                    db.query(insertCategoriaQuery, [result.insertId, categoriaId])
                );
                await Promise.all(insertPromises);
            }

            // Get the created book with categories
            const [newBook] = await db.query(`
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

            // Upload new cover image
            const result = await cloudinary.uploader.upload(req.file.path);
            const portadaUrl = result.secure_url;

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