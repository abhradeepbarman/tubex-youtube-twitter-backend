const { isValidObjectId, default: mongoose } = require("mongoose");
const Like = require("../models/like.model");

exports.toggleVideoLike = async (req, res) => {
    try {
        const { videoId } = req.params;
        const userId = req.user._id;

        //validation
        if (!isValidObjectId(videoId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid Video ID",
            });
        }

        const like = await Like.findOne({
            video: videoId,
            likedBy: userId,
        });

        let result;

        if (like) {
            // like -> so dislike the video
            result = await Like.findOneAndDelete({
                video: videoId,
                likedBy: userId,
            });
        } else {
            // not likes -> so like the video
            result = await Like.create({
                video: videoId,
                likedBy: userId,
            });
        }

        if (!result) {
            return res.status(500).json({
                success: false,
                message: "Error while toggling video like",
            });
        }

        return res.status(200).json({
            success: true,
            message: "Video like toggled successfully!",
            result,
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: "Internal Server error",
        });
    }
};

exports.toggleCommentLike = async (req, res) => {
    try {
        const { commentId } = req.params;
        const userId = req.user._id;

        //validation
        if (!isValidObjectId(commentId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid Comment ID",
            });
        }

        const like = await Like.findOne({
            comment: commentId,
            likedBy: userId,
        });

        let result;

        if (like) {
            // like -> so dislike the comment
            result = await Like.findOneAndDelete({
                comment: commentId,
                likedBy: userId,
            });
        } else {
            // not likes -> so like the comment
            result = await Like.create({
                comment: commentId,
                likedBy: userId,
            });
        }

        if (!result) {
            return res.status(500).json({
                success: false,
                message: "Error while toggling comment like",
            });
        }

        return res.status(200).json({
            success: true,
            message: "Comment like toggled successfully!",
            result,
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: "Internal Server error",
        });
    }
};

exports.toggleTweetLike = async (req, res) => {
    try {
        const { tweetId } = req.params;
        const userId = req.user._id;

        //validation
        if (!isValidObjectId(tweetId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid Tweet ID",
            });
        }

        const like = await Like.findOne({
            tweet: tweetId,
            likedBy: userId,
        });

        let result;

        if (like) {
            // like -> so dislike the tweet
            result = await Like.findOneAndDelete({
                tweet: tweetId,
                likedBy: userId,
            });
        } else {
            // not likes -> so like the tweet
            result = await Like.create({
                tweet: tweetId,
                likedBy: userId,
            });
        }

        if (!result) {
            return res.status(500).json({
                success: false,
                message: "Error while toggling tweet like",
            });
        }

        return res.status(200).json({
            success: true,
            message: "Tweet like toggled successfully!",
            result,
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: "Internal Server error",
        });
    }
};

exports.getLikedVideos = async (req, res) => {
    try {
        // get all liked videos of a user
        const userId = req.user._id;
    
        const likedVideos = await Like.aggregate([
            {
                $match: {
                    likedBy: new mongoose.Types.ObjectId(userId),
                    video: {
                        $ne: null,
                    },
                },
            },
            {
                $lookup: {
                    from: "videos",
                    localField: "video",
                    foreignField: "_id",
                    as: "video",
                    pipeline: [
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
                                            coverImage: 1,
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
                        },
                    ],
                },
            },
            {
                $addFields: {
                    video: {
                        $first: "$video",
                    },
                },
            },
        ]);
    
        if(!likedVideos) {
            return res.status(500).json({
                success: false,
                message: "Error while fetching liked videos"
            })
        }
    
        return res.status(200).json({
            success: true,
            message: "Liked videos fetched successfully",
            likedVideos
        })
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        })
    }
};
