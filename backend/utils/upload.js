const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('cloudinary').v2;

// Configure Cloudinary credentials from environment variables
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Configure Cloudinary storage engine
const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: async (req, file) => {
        // Dynamically route destination folder based on route endpoint
        const isClaim = req.originalUrl && req.originalUrl.includes('claim');

        return {
            folder: isClaim ? 'lost_and_found_claims' : 'lost_and_found_uploads',
            allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
            public_id: `${file.fieldname}-${Date.now()}-${Math.round(Math.random() * 1e9)}`,
        };
    },
});

// Multer upload middleware configuration
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB strict file size limit
    },
    fileFilter: (req, file, cb) => {
        // Validate image mimetype
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files (JPG, JPEG, PNG, WEBP) are allowed!'), false);
        }
    },
});

module.exports = upload;