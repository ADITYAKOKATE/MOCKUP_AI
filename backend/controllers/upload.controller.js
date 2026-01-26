const cloudinary = require('../utils/cloudinary');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Set Storage Engine - Store locally first then upload
const storage = multer.diskStorage({
    destination: './uploads/',
    filename: function (req, file, cb) {
        cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
    }
});

// Init Upload
const upload = multer({
    storage: storage,
    limits: { fileSize: 5000000 }, // 5MB limit
    fileFilter: function (req, file, cb) {
        checkFileType(file, cb);
    }
}).single('image');

// Check File Type
function checkFileType(file, cb) {
    const filetypes = /jpeg|jpg|png|gif|webp/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);

    if (mimetype && extname) {
        return cb(null, true);
    } else {
        cb('Error: Images Only!');
    }
}

exports.uploadImage = (req, res) => {
    upload(req, res, async (err) => {
        if (err) {
            return res.status(400).json({ message: err });
        } else {
            if (req.file == undefined) {
                return res.status(400).json({ message: 'No file selected!' });
            } else {
                try {
                    // Upload to Cloudinary
                    const result = await cloudinary.uploader.upload(req.file.path, {
                        folder: 'loop_profiles',
                    });

                    // Remove file from local uploads
                    fs.unlinkSync(req.file.path);

                    res.json({
                        message: 'File Uploaded!',
                        imageUrl: result.secure_url,
                        publicId: result.public_id
                    });
                } catch (cloudinaryError) {
                    console.error('Cloudinary Upload Error:', cloudinaryError);
                    res.status(500).json({ message: 'Cloudinary Upload Failed' });
                }
            }
        }
    });
};
