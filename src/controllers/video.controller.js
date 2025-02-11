const mongoose = require("mongoose");
const Video = require("../models/video.model");

const {
    uploadOnCloudinary,
    deleteFromCloudinary,
} = require("../utils/cloudinary");
const User = require("../models/user.model");

exports.publishVideo = async (req, res) => {
    try {
        const userId = req.user._id;
        const { title, description, isPublished } = req.body;

        if (!title || !description) {
            return res.status(400).json({
                success: false,
                message: "All fields are required",
            });
        }

        const videoFileLocalPath = req.files?.videoFile[0]?.path;
        const thumbnailLocalPath = req.files?.thumbnail[0]?.path;

        if (!videoFileLocalPath || !thumbnailLocalPath) {
            return res.status(400).json({
                success: false,
                message: "Video & thumbnail both are required",
            });
        }

        const videoFile = await uploadOnCloudinary(videoFileLocalPath);
        const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);

        if (!videoFile || !thumbnail) {
            return res.status(400).json({
                success: false,
                message: "Error while uploading files",
            });
        }

        const video = await Video.create({
            videoFile: videoFile.url,
            thumbnail: thumbnail.url,
            owner: userId,
            title,
            description,
            duration: videoFile.duration,
            isPublished,
        });

        return res.status(200).json({
            success: true,
            message: "Video published successfully!",
            video,
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};

exports.getVideoById = async (req, res) => {
    try {
        // take video id from params
        const { videoId } = req.params;

        //take user id
        const userId = req.user._id

        // validation
        if (!videoId) {
            return res.status(400).json({
                success: false,
                message: "Video ID not found!",
            });
        }

        // fetch video
        const video = await Video.findById(videoId).populate({
            path: "owner",
            select: "-password -refreshToken -watchHistory",
        });

        if (!video) {
            return res.status(404).json({
                success: false,
                message: "Video not found!",
            });
        }

        //increase video views
        await Video.findByIdAndUpdate(
            videoId,
            {
                $inc: {
                    views: 1
                }
            }
        )

        // add this video in the user watch history
        await User.findByIdAndUpdate(
            userId,
            {
                $addToSet: {
                    watchHistory: videoId
                }
            },
            {new: true}
        )

        // return response
        return res.status(200).json({
            success: true,
            message: "Video fetched successfully",
            video,
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};

exports.updateVideo = async (req, res) => {
    try {
        // fetch videoID
        const { videoId } = req.params;

        if (!videoId) {
            return res.status(400).json({
                success: false,
                message: "Video ID is required",
            });
        }

        // validation
        const video = await Video.findById(videoId);

        if (!video) {
            return res.status(404).json({
                success: false,
                message: "Video not found",
            });
        }

        // fetch thumbnail, title, description
        const thumbnailLocalPath = req.file?.path;
        const { title, description } = req.body;

        //validation
        if (!thumbnailLocalPath && !title && !description) {
            return res.status(400).json({
                success: false,
                message: "Atleast one update field is required",
            });
        }

        // upload thumbnail to cloudinary
        let newThumbnail;
        if (thumbnailLocalPath) {
            newThumbnail = await uploadOnCloudinary(thumbnailLocalPath);
        }
        const oldThumbnail = video.thumbnail;

        // update the video
        if (title) {
            video.title = title;
        }
        if (description) {
            video.description = description;
        }
        if (thumbnailLocalPath) {
            video.thumbnail = newThumbnail.url;
        }

        const updatedVideo = await video.save();

        if (!updatedVideo) {
            return res.status(500).json({
                success: false,
                message: "Error while updating video",
            });
        }

        // delete old thumbnail
        if (newThumbnail) {
            await deleteFromCloudinary(oldThumbnail);
        }

        // return response
        return res.status(200).json({
            success: true,
            message: "Video updated successfully!",
            updatedVideo,
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};

exports.togglePublishStatus = async (req, res) => {
    try {
        // get video id
        const { videoId } = req.params;

        if (!videoId) {
            return res.status(400).json({
                success: false,
                message: "Video ID is required",
            });
        }

        // update publid status
        const video = await Video.findById(videoId);

        if (!video) {
            return res.status(404).json({
                success: false,
                message: "Video not found",
            });
        }

        video.isPublished = !video.isPublished;
        const updatedVideo = await video.save();

        if (!updatedVideo) {
            return res.status(500).json({
                success: false,
                message: "Error while toggling publish status",
            });
        }

        return res.status(200).json({
            success: true,
            message: "Publish status toggled successfully!",
            updatedVideo,
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};

exports.deleteVideo = async (req, res) => {
    try {
        // get video id
        const { videoId } = req.params;

        if (!videoId) {
            return res.status(400).json({
                success: false,
                message: "Video ID is required",
            });
        }

        // delete video
        const video = await Video.findById(videoId);

        //validation
        if (!video) {
            return res.status(404).json({
                success: false,
                message: "Video not found",
            });
        }

        const thumbnailUrl = video.thumbnail;
        const videoUrl = video.videoFile;

        //delete thumbnail & video from cloudinary
        await deleteFromCloudinary(thumbnailUrl);
        await deleteFromCloudinary(videoUrl, true);

        // delete video data from DB
        const deletedVideo = await Video.findByIdAndDelete(videoId);

        if (!deletedVideo) {
            return res.status(500).json({
                success: false,
                message: "Error while deleting video!",
            });
        }

        // return response
        return res.status(200).json({
            success: true,
            message: "Video deleted Successfully!",
            deletedVideo,
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};

exports.getAllVideos = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 10,
            query,
            sortBy,
            sortType,
            userId,
        } = req.query;

        // for using Full Text based search u need to create a search index in mongoDB atlas
        // you can include field mapppings in search index eg.title, description, as well
        // Field mappings specify which fields within your documents should be indexed for text search.
        // this helps in seraching only in title, desc providing faster search results
        // here the name of search index is 'search-videos'

        const pipeline = [];

        if (query) {
            pipeline.push({
                $search: {
                    index: "search-videos",
                    text: {
                        query: query,
                        path: ["title", "description"], //search only on title, desc
                    },
                },
            });
        }

        if (userId) {
            pipeline.push({
                $match: {
                    owner: new mongoose.Types.ObjectId(userId),
                },
            });
        }

        // fetch videos where isPublished is true
        pipeline.push({
            $match: {
                isPublished: true,
            },
        });

        if (sortBy && sortType) {
            pipeline.push({
                $sort: {
                    [sortBy]: sortType === "asc" ? 1 : -1,
                },
            });
        } else {
            pipeline.push({
                $sort: {
                    createdAt: -1,
                },
            });
        }

        pipeline.push(
            {
                $lookup: {
                    from: "users",
                    localField: "owner",
                    foreignField: "_id",
                    as: "owner",
                    pipeline: [
                        {
                            $project: {
                                username: 1,
                                fullName: 1,
                                avatar: 1,
                            },
                        },
                    ],
                },
            },
            {
                $addFields: {
                    owner: {
                        $first: "$owner",
                    },
                },
            }
        );

        const videoAggregate = Video.aggregate(pipeline);

        const options = {
            page: parseInt(page, 10),
            limit: parseInt(limit, 10),
            useFacet: false,
        };

        const videos = await Video.aggregatePaginate(videoAggregate, options);

        return res.status(200).json({
            success: true,
            message: "All videos fetched successfully!",
            videos,
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};
