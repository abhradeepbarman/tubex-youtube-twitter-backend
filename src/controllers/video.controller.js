const Video = require("../models/video.model");
const { uploadOnCloudinary } = require("../utils/cloudinary");

exports.publishVideo = async(req, res) => {
    try {
        const userId = req.user._id;
        const {title, description, isPublished} = req.body;

        if(!title || !description) {
            return res.status(400).json({
                success: false,
                message: "All fields are required"
            })
        }

        const videoFileLocalPath = req.files?.videoFile[0]?.path
        const thumbnailLocalPath = req.files?.thumbnail[0]?.path

        if(!videoFileLocalPath || !thumbnailLocalPath) {
            return res.status(400).json({
                success: false,
                message: "Video & thumbnail both are required"
            })
        }

        const videoFile = await uploadOnCloudinary(videoFileLocalPath)
        const thumbnail = await uploadOnCloudinary(thumbnailLocalPath)

        if(!videoFile || !thumbnail) {
            return res.status(400).json({
                success: false,
                message: "Error while uploading files"
            })
        }

        const video = await Video.create({
            videoFile: videoFile.url,
            thumbnail: thumbnail.url,
            owner: userId,
            title,
            description,
            duration: videoFile.duration,
            isPublished
        }) 
        
        return res.status(200).json({
            success: true,
            message: "Video published successfully!",
            video
        })
    } 
    catch (error) {
        console.log("Error:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
        })
    }
}