const cloudinary = require('../config/cloudinary');

const uploadFilesToCloudinary = async (files) => {
    try {
        const uploadedFiles = [];

        // Loop through each file and upload to Cloudinary
        for (const file of files) {
            const result = await cloudinary.uploader.upload(file.path, {
                folder: "chat_attachments", // Specify the folder name where you want to store files
                resource_type: "auto",      // Automatically detect file type (image, video, etc.)
            });

            uploadedFiles.push({
                public_id: result.public_id,
                url: result.secure_url,
            });
        }

        return uploadedFiles;
    } catch (error) {
        console.error("Error uploading to Cloudinary:", error);
        throw new Error("Failed to upload files");
    }
};

const uploadAttachmentsToCloudinary = async (files = []) => {
    const uploadPromises = files.map((file) => {
        return new Promise((resolve, reject) => {
            cloudinary.uploader.upload(
                getBase64(file),
                {
                    resource_type: "auto",
                    public_id: uuid(),
                },
                (error, result) => {
                    if (error) return reject(error);
                    resolve(result);
                }
            );
        });
    });

    try {
        const results = await Promise.all(uploadPromises);

        const formattedResults = results.map((result) => ({
            public_id: result.public_id,
            url: result.secure_url,
        }));
        return formattedResults;
    } catch (err) {
        throw new Error("Error uploading files to cloudinary", err);
    }
};

module.exports = { uploadFilesToCloudinary, uploadAttachmentsToCloudinary }