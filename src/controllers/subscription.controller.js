const { default: mongoose } = require("mongoose");
const Subscription = require("../models/subscription.model");
const User = require("../models/user.model");

// toggle subscription
exports.toggleSubscription = async (req, res) => {
    try {
        const { channelId } = req.params;
        const userId = req.user._id;

        //check if both are same - a user cannot subscribe himself
        if (channelId.toString() === userId.toString()) {
            return res.status(400).json({
                success: false,
                message: "Invalid request",
            });
        }

        // check if channel is present
        const channel = await User.findById(channelId);

        if (!channel) {
            return res.status(400).json({
                success: false,
                message: "Invalid Channel ID",
            });
        }

        // check if subscribed
        const subscription = await Subscription.findOne({
            subscriber: userId,
            channel: channel._id,
        });

        let response;
        if (subscription) {
            // if yes -> unsubscribe
            response = await Subscription.findOneAndDelete({
                subscriber: userId,
                channel: channel._id,
            });
        } else {
            // if no -x> subscribe
            response = await Subscription.create({
                subscriber: userId,
                channel: channel._id,
            });
        }

        //validation
        if (!response) {
            return res.status(500).json({
                success: false,
                message: "Error while toggling channel subscription",
            });
        }

        // return res
        return res.status(200).json({
            success: true,
            message: "Channel subscription toggled successfully!",
            response,
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};

// controller to return channel list to which user has subscribed
exports.getSubscribedChannels = async (req, res) => {
    try {
        const { subscriberId } = req.params;

        //validation
        const subscriber = await User.findById(subscriberId);

        if (!subscriber) {
            return res.status(400).json({
                success: false,
                message: "Invalid User ID",
            });
        }

        //find the all the subscription models
        const channels = await Subscription.aggregate([
            {
                $match: {
                    subscriber: new mongoose.Types.ObjectId(subscriberId),
                },
            },
            {
                $project: {
                    channel: 1,
                },
            },
            {
                $lookup: {
                    from: "users",
                    localField: "channel",
                    foreignField: "_id",
                    as: "channel",
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
                    channel: {
                        $first: "$channel",
                    },
                },
            }
        ]);

        //validation
        if (!channels) {
            return res.status(500).json({
                success: false,
                message: "Error while fetching all subscribed channels!",
            });
        }

        //return res
        return res.status(200).json({
            success: true,
            message: "ALl subscribed channels are fetched",
            channels,
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};

// controller to return subscriber list of a channel
exports.getUserChannelSubscribers = async (req, res) => {
    try {
        const { channelId } = req.params;

        //validation
        const channel = await User.findById(channelId);

        if (!channel) {
            return res.status(400).json({
                success: false,
                message: "Inavlid channel ID",
            });
        }

        //find all the sub. models where channel = channel id
        const subscribers = await Subscription.aggregate([
            {
                $match: {
                    channel: new mongoose.Types.ObjectId(channelId),
                },
            },
            {
                $project: {
                    subscriber: 1,
                },
            },
            {
                $lookup: {
                    from: "users",
                    localField: "subscriber",
                    foreignField: "_id",
                    as: "subscriber",
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
                    subscriber: {
                        $first: "$subscriber",
                    },
                },
            },
        ]);

        //validation
        if (!subscribers) {
            return res.status(500).json({
                success: false,
                message: "Error while fetching subscribers",
            });
        }

        //return res
        return res.status(200).json({
            success: true,
            message: "Subscribers fetched successfully",
            subscribers,
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};
