const pool = require('../config/db');

class DataService {
    // Get available templates
    async getTemplates() {
        return templateService.getAllTemplates();
    }

    // Get specific template
    async getTemplate(entity) {
        return templateService.getTemplate(entity);
    }

    // Generate template file
    async generateTemplateFile(entity) {
        return templateService.generateTemplateFile(entity);
    }
    // Helper function to get all related data for books
    async getBookRelatedData(bookIds) {
        const [categories] = await pool.query(
            'SELECT DISTINCT c.* FROM categoria c INNER JOIN librocategoria lc ON c.id = lc.categoriaId WHERE lc.libroId IN (?)',
            [bookIds]
        );
        
        const [reviews] = await pool.query(
            'SELECT * FROM resena WHERE libroId IN (?)',
            [bookIds]
        );
        
        return { categories, reviews };
    }

    // Export data based on selected entities
    async exportData(entities) {
        const exportData = {};

        // If 'all' is selected, export everything
        if (entities.includes('all')) {
            entities = ['books', 'users', 'loans', 'reviews'];
        }

        if (entities.includes('books')) {
            const [books] = await pool.query('SELECT * FROM libro');
            exportData.books = books;

            // Always include categories and relationships when exporting books
            const bookIds = books.map(book => book.id);
            const [categories] = await pool.query(
                'SELECT DISTINCT c.* FROM categoria c INNER JOIN librocategoria lc ON c.id = lc.categoriaId WHERE lc.libroId IN (?)',
                [bookIds]
            );
            exportData.categories = categories;

            // Include book-category relationships
            const [bookCategories] = await pool.query(
                'SELECT * FROM librocategoria WHERE libroId IN (?)',
                [bookIds]
            );
            exportData.bookCategories = bookCategories;
        }

        if (entities.includes('users')) {
            const [users] = await pool.query('SELECT id, nombre, email, rol, createdAt FROM usuario');
            exportData.users = users;
        }

        if (entities.includes('loans')) {
            const [loans] = await pool.query(
                'SELECT p.*, u.nombre as nombreUsuario, l.titulo as tituloLibro FROM prestamo p ' +
                'JOIN usuario u ON p.usuarioId = u.id ' +
                'JOIN libro l ON p.libroId = l.id'
            );
            exportData.loans = loans;
        }

        if (entities.includes('reviews')) {
            const [reviews] = await pool.query(
                'SELECT r.*, u.nombre as nombreUsuario, l.titulo as tituloLibro FROM resena r ' +
                'JOIN usuario u ON r.usuarioId = u.id ' +
                'JOIN libro l ON r.libroId = l.id'
            );
            exportData.reviews = reviews;
        }

        return exportData;
    }

    // Import data with transaction support
    async importData(data, entities) {
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();

            if (entities.includes('books') && data.books) {
                // Import categories first
                if (data.categories) {
                    for (const category of data.categories) {
                        await connection.query(
                            'INSERT IGNORE INTO categoria (id, nombre) VALUES (?, ?)',
                            [category.id, category.nombre]
                        );
                    }
                }

                // Import books
                for (const book of data.books) {
                    await connection.query(
                        'INSERT IGNORE INTO libro (id, titulo, autor, editorial, imagen, descripcion) VALUES (?, ?, ?, ?, ?, ?)',
                        [book.id, book.titulo, book.autor, book.editorial, book.imagen, book.descripcion]
                    );
                }

                // Import reviews if selected
                if (data.reviews) {
                    for (const review of data.reviews) {
                        await connection.query(
                            'INSERT IGNORE INTO resena (id, libroId, usuarioId, comentario, calificacion, createdAt) VALUES (?, ?, ?, ?, ?, ?)',
                            [review.id, review.libroId, review.usuarioId, review.comentario, review.calificacion, review.createdAt]
                        );
                    }
                }
            }

            if (entities.includes('users') && data.users) {
                for (const user of data.users) {
                    await connection.query(
                        'INSERT IGNORE INTO usuario (id, nombre, email, rol, createdAt) VALUES (?, ?, ?, ?, ?)',
                        [user.id, user.nombre, user.email, user.rol, user.createdAt]
                    );
                }
            }

            if (entities.includes('loans') && data.loans) {
                for (const loan of data.loans) {
                    await connection.query(
                        'INSERT IGNORE INTO prestamo (id, usuarioId, libroId, fechaPrestamo, fechaDevolucionEsperada, fechaDevolucionReal, estado) ' +
                        'VALUES (?, ?, ?, ?, ?, ?, ?)',
                        [loan.id, loan.usuarioId, loan.libroId, loan.fechaPrestamo, loan.fechaDevolucionEsperada, loan.fechaDevolucionReal, loan.estado]
                    );
                }
            }

            if (entities.includes('reviews') && data.reviews) {
                for (const review of data.reviews) {
                    await connection.query(
                        'INSERT IGNORE INTO resena (id, libroId, usuarioId, comentario, calificacion, createdAt) ' +
                        'VALUES (?, ?, ?, ?, ?, ?)',
                        [review.id, review.libroId, review.usuarioId, review.comentario, review.calificacion, review.createdAt]
                    );
                }
            }

            await connection.commit();
            return { success: true, message: 'Data imported successfully' };
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }
}

module.exports = new DataService();