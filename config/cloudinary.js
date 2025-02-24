const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

// Get book covers folder from environment variable or use default
const BOOK_COVERS_FOLDER = process.env.CLOUDINARY_BOOK_FOLDER || 'book-covers';

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// Configuración para archivos de chat
const chatStorage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'chat-attachments',
        allowed_formats: ['jpg', 'png', 'pdf', 'doc', 'docx'],
        resource_type: 'auto'
    }
});

// Configuración para portadas de libros
const bookCoverStorage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'book-covers',
        allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
        transformation: [{ width: 500, height: 750, crop: 'fill' }]
    }
});

const uploadChatFile = multer({ 
    storage: chatStorage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB límite
    }
});

const uploadBookCover = multer({
    storage: bookCoverStorage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB límite
    }
});

module.exports = {
    cloudinary,
    uploadChatFile,
    uploadBookCover
};