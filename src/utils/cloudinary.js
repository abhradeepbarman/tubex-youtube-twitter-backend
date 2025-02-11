const cloudinary = require("cloudinary").v2
const fs = require("fs")
require("dotenv").config()

cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
    api_key: process.env.CLOUDINARY_API_KEY, 
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const uploadOnCloudinary = async (localFilePath) => {
    try {
        //check file is locally available
        if(!localFilePath) return null

        //upload the file on cloudinary
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto",
            folder: "Youtube-Twitter"
        })

        // file has been uploaded successfully
        // console.log("File is uploaded on cloudinary: ", response.url);
        fs.unlinkSync(localFilePath)
        return response
    } 
    catch (error) {
        fs.unlinkSync(localFilePath)  // remove the locally saved temp file as the upload operation got failed
        return null
    }
}

const deleteFromCloudinary = async (url, isVideo=false) => {
    try {
        if(!url) return null
        
        const part = url.split("/")
        const fileName = part[part.length -1].split(".")[0]
        const folderName = part[part.length -2]
        const public_id = folderName + "/" + fileName

        const response = await cloudinary.uploader.destroy(public_id, {
            resource_type: isVideo ? "video" : "image"
        })
        return response
    } 
    catch (error) {
        console.log("ERROR: ", error);
        return null;
    }
}

module.exports = {uploadOnCloudinary, deleteFromCloudinary}