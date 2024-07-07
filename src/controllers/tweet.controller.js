const { default: mongoose, isValidObjectId } = require("mongoose");
const Like = require("../models/like.model");
const Tweet = require("../models/tweet.model");

exports.createTweet = async (req, res) => {
    try {
        //get user id
        const userId = req.user._id;

        //get content from body
        const { content } = req.body;

        //validation
        if (!content) {
            return res.status(400).json({
                success: false,
                message: "All fields are required",
            });
        }

        //create tweet
        const tweet = await Tweet.create({
            owner: userId,
            content,
        });

        if (!tweet) {
            return res.status(500).json({
                success: false,
                message: "Error while creating tweet",
            });
        }

        //return response
        return res.status(200).json({
            success: true,
            message: "Tweet created successfully",
            tweet,
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};

exports.getUserTweets = async (req, res) => {
    try {
        //get userId
        const { userId } = req.params;

        //validation
        if (!isValidObjectId(userId)) {
            return res.status(400).json({
                success: false,
                message: "Inavlid user ID",
            });
        }

        //fetch tweets
        const tweets = await Tweet.aggregate([
            {
                $match: {
                    owner: new mongoose.Types.ObjectId(userId),
                },
            },
            {
                $lookup: {
                    from: "likes",
                    localField: "_id",
                    foreignField: "tweet",
                    as: "likes",
                    pipeline: [
                        {
                            $project: {
                                likedBy: 1,
                            },
                        },
                        {
                            $lookup: {
                                from: "users",
                                localField: "likedBy",
                                foreignField: "_id",
                                as: "likedBy",
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
                                likedBy: {
                                    $first: "$likedBy",
                                },
                            },
                        },
                    ],
                },
            },
            {
                $addFields: {
                    likes: {
                        $map: {
                            input: "$likes",
                            as: "like",
                            in: "$$like.likedBy",
                        },
                    },
                },
            },
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
                    owner: { $arrayElemAt: ["$owner", 0] },
                },
            },
        ]);

        // $map iterates over the likes array, and for each element (referred to as like), it returns the likedBy object. The result will be a new array likedBy containing only the likedBy objects from the original likes array.

        //validation
        if (!tweets) {
            return res.status(500).json({
                success: false,
                message: "Error while fetching tweets",
            });
        }

        //return response
        return res.status(200).json({
            success: true,
            message: "Tweets fetched successfully",
            tweets,
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};

exports.updateTweet = async (req, res) => {
    try {
        //get tweet id from params
        const { tweetId } = req.params;

        //get content from body
        const { content } = req.body;

        //validation
        if (!tweetId) {
            return res.status(400).json({
                success: false,
                message: "Tweet ID is required",
            });
        }

        if (!content) {
            return res.status(400).json({
                success: false,
                message: "Content is required",
            });
        }

        //update
        const tweet = await Tweet.findById(tweetId);

        if (!tweet) {
            return res.status(404).json({
                success: false,
                message: "Tweet not found",
            });
        }

        //Authorization
        if (req.user?._id.toString() !== tweet.owner.toString()) {
            return res.status(400).json({
                success: false,
                message: "Only owner can edit this Tweet",
            });
        }

        const updatedTweet = await Tweet.findByIdAndUpdate(tweetId, {
            content,
        });

        //validation
        if (!updatedTweet) {
            return res.status(500).json({
                success: false,
                message: "Error while updating tweet",
            });
        }

        //return response
        return res.status(200).json({
            success: true,
            message: "Tweet updated successfully",
            updatedTweet,
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};

exports.deleteTweet = async (req, res) => {
    try {
        //get tweet id from params
        const { tweetId } = req.params;

        //validation
        if (!tweetId) {
            return res.status(400).json({
                success: false,
                message: "Tweet ID is required",
            });
        }

        const tweet = await Tweet.findById(tweetId);

        if (!tweet) {
            return res.status(400).json({
                success: false,
                message: "Tweet not found",
            });
        }

        //Authorization
        if (req.user?._id.toString() !== tweet?.owner.toString()) {
            return res.status(400).json({
                success: false,
                message: "Only owner can delete this Tweet",
            });
        }

        //delete tweet
        const deletedTweet = await Tweet.findByIdAndDelete(tweetId);

        //validation
        if (!deletedTweet) {
            return res.status(500).json({
                success: false,
                message: "Error while deleting Tweet",
            });
        }

        //delete likes on the tweet also
        const result = await Like.deleteMany({
            tweet: tweetId,
        });

        //return response
        return res.status(200).json({
            success: true,
            message: "Tweet deleted successfully",
            deletedTweet,
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};
