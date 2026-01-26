const cloudinary = require('cloudinary').v2;

// Cloudinary will automatically configure itself if CLOUDINARY_URL is present in env
// But we can also manually configure it if needed
if (!process.env.CLOUDINARY_URL) {
    console.warn('Warning: CLOUDINARY_URL not found in environment variables.');
} else {
    // Ensuring it picks up the url from env if not auto-picked
    // cloudinary.config({
    //     cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    //     api_key: process.env.CLOUDINARY_API_KEY,
    //     api_secret: process.env.CLOUDINARY_API_SECRET
    // });
}

module.exports = cloudinary;
