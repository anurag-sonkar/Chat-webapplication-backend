// const cloudinary = require('../config/cloudinary');
// const multer = require('multer');
// const { CloudinaryStorage } = require('multer-storage-cloudinary');

// // Set up Cloudinary storage
// const storage = new CloudinaryStorage({
//   cloudinary: cloudinary,
//   params: {
//     folder: 'user_avatar',  // Folder name in your Cloudinary storage
//     allowed_formats: ['jpeg', 'png', 'jpg'],  // Restrict allowed file types
//   },
// });

// // const fileFilter = (req, file, cb) => {
// //   if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png' || file.mimetype === 'image/jpg') {
// //     cb(null, true);
// //   } else {
// //     cb(new Error('Invalid file type. Only JPEG, PNG, and JPG are allowed.'), false);
// //   }
// // };

// // Set up multer with Cloudinary storage
// const upload = multer({ storage: storage });

// // Middleware function to upload image and add path to req.user
// const avatarUpload = (req, res, next) => {
//   upload.single('avatar')(req, res, function (err) {
//     if (err) {
//       return res.status(400).json({ message: err.message });
//     }

//     // Check if file is uploaded
//     if (req.file) {
//       // Store Cloudinary image URL in req.user for future processing
//       req.body = { ...req.body, avatar: { public_id: req.file.filename, url: req.file.path } };
//     }

//     next();
//   });
// };

// const deleteImage = async (public_id) => {
//   try {
//     const result = await cloudinary.uploader.destroy(public_id.toString());
//     console.log('Image deleted:', result);
//     return result;
//   } catch (error) {
//     console.error('Error deleting image:', error);
//     throw new Error('Could not delete image');
//   }
// };


// const attachmentsMulter = upload.array("files", 5);

// module.exports = { avatarUpload, deleteImage, attachmentsMulter };

const cloudinary = require('../config/cloudinary');
const multer = require('multer');
const streamifier = require('streamifier');

const storage = multer.memoryStorage(); // Store the file in memory buffer
const upload = multer({ storage: storage });

const uploadToCloudinary = (buffer) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder: "user-avatar" },  // Specifying folder 
      (error, result) => {
        if (result) {
          resolve(result);
        } else {
          reject(error);
        }
      }
    );
    streamifier.createReadStream(buffer).pipe(uploadStream);
  });
};

const deleteCloudinaryImage = async (publicId) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result;  // You can return the result or handle it as needed
  } catch (error) {
    console.error("Error deleting image from Cloudinary:", error);
    throw error;  // Rethrow the error to handle it in the calling function
  }
};


module.exports = { upload, uploadToCloudinary, deleteCloudinaryImage }