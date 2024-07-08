const { default: mongoose } = require("mongoose");
const Video = require("../models/video.model");
const Subscription = require("../models/subscription.model");

exports.getChannelStats = async (req, res) => {
    try {
        // TODO: Get the channel stats like total video views, total subscribers, total videos, total likes etc.
        const userId = req.user;

        // The $group stage separates documents into groups according to a "group key".
        // The output documents can also contain additional fields that are set using accumulator expressions.

        const videos = await Video.aggregate([
            {
                $match: {
                    owner: new mongoose.Types.ObjectId(userId),
                },
            },
            {
                $lookup: {
                    from: "likes",
                    localField: "_id",
                    foreignField: "video",
                    as: "likes",
                },
            },
            {
                $group: {
                    _id: null,
                    totalViews: {
                        $sum: "$views",
                    },
                    totalLikes: {
                        $sum: {
                            $size: "$likes",
                        },
                    },
                },
            },
        ]);

        const subscribers = await Subscription.find({
            channel: userId,
        });

        const totalSubscribers = subscribers?.length;

        const channelStats = {
            totalViews: videos?.at(0)?.totalViews || 0,
            totalLikes: videos?.at(0)?.totalLikes || 0,
            totalSubscribers: totalSubscribers || 0,
        };

        return res.status(200).json({
            success: true,
            message: "Channel stats fetched successfully",
            channelStats,
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};

exports.getChannelVideos = async (req, res) => {
    try {
        // TODO: Get all the videos uploaded by the channel
        const userId = req.user._id;

        const videos = await Video.aggregate([
            {
                $match: {
                    owner: new mongoose.Types.ObjectId(userId),
                },
            },
            {
                $lookup: {
                    from: "likes",
                    localField: "_id",
                    foreignField: "video",
                    as: "likes"
                },
            },
            {
                $project: {
                    "likes": {
                        $size: "$likes"
                    },
                    "_id": 1,
                    "videoFile": 1,
                    "thumbnail": 1,
                    "title": 1,
                    "description": 1,
                    "duration":1,
                    "views": 1,
                    "isPublished": 1,
                    "createdAt": 1,
                    "updatedAt": 1 
                }
            }
        ]);

        return res.status(200).json({
            success: true,
            message: "Channel Videos fetched successfully",
            videos
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};
