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

// New function for attachments upload
// const uploadAttachmentsToCloudinary = (files) => {
//   if (files.length > 5) {
//     throw new Error("Files can't be more than 5");
//   }

//   // Create promises to upload each file
//   const uploadPromises = files.map(file => {
//     return new Promise((resolve, reject) => {
//       const fileType = file.mimetype.split('/')[0]; // Get file type (image, video, etc.)
//       const folder = `attachments/${fileType}`; // Folder based on file type (e.g., attachments/image, attachments/video)

//       const uploadStream = cloudinary.uploader.upload_stream(
//         { folder: folder },  // Uploading to specific folder
//         (error, result) => {
//           if (result) {
//             resolve(result);
//           } else {
//             reject(error);
//           }
//         }
//       );
//       streamifier.createReadStream(file.buffer).pipe(uploadStream);
//     });
//   });

//   // Return a promise to resolve all uploads
//   return Promise.all(uploadPromises);
// };

const uploadAttachmentsToCloudinary = async (files) => {
  const uploadPromises = files.map(file => {
    const fileType = file.mimetype.split('/')[0]; // Get the file type from mimetype (e.g., 'image', 'video', 'application')
    
    let resourceType = 'raw'; // Default for docs like PDF
    if (fileType === 'image') resourceType = 'image';
    if (fileType === 'video' || fileType === 'audio') resourceType = 'video';
    
    return uploadToCloudinary(file.buffer, resourceType); // Upload based on file type
  });

  return Promise.all(uploadPromises); // Wait for all uploads to complete
};


module.exports = { upload, uploadToCloudinary, deleteCloudinaryImage, uploadAttachmentsToCloudinary }