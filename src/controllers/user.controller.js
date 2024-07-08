const { default: mongoose } = require("mongoose");
const User = require("../models/user.model");
const {
    uploadOnCloudinary,
    deleteFromCloudinary,
} = require("../utils/cloudinary");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const generateAccessAndRefreshToken = async (userId) => {
    try {
        const user = await User.findById(userId);

        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false });

        return { accessToken, refreshToken };
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};

exports.register = async (req, res) => {
    try {
        // get user details from req
        const { username, email, fullName, password } = req.body;

        // validation - not empty
        if (!username || !email || !fullName || !password) {
            return res.status(400).json({
                success: false,
                message: "All fields are required",
            });
        }

        // check if user already exists: username, email
        const existingUser = await User.findOne({
            $or: [{ username }, { email }],
        });

        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: "User with email or username already exists",
            });
        }

        // get avatar
        const avatarLocalPath = req.files?.avatar[0]?.path;

        // get cover image, it might or might not be present
        let coverImageLocalPath;
        if (
            req.files &&
            Array.isArray(req.files?.coverImage) &&
            req.files?.coverImage.length > 0
        ) {
            coverImageLocalPath = req.files.coverImage[0].path;
        }

        //avatar is mandatory
        if (!avatarLocalPath) {
            return res.status(400).json({
                success: false,
                message: "Avatar is required",
            });
        }

        // upload them to cloudinary
        const avatar = await uploadOnCloudinary(avatarLocalPath);
        const coverImage = await uploadOnCloudinary(coverImageLocalPath); // if local path is empty, cloudinary will give null

        if (!avatar) {
            return res.status(400).json({
                success: false,
                message: "Avatar not found",
            });
        }

        // create user
        const user = await User.create({
            username: username.trim().toLowerCase(),
            email,
            fullName,
            password,
            avatar: avatar.url,
            coverImage: coverImage?.url || "",
        });

        if (!user) {
            return res.status(500).json({
                success: false,
                message: "User not registered",
            });
        }

        // remove password and refresh token field from response
        user.password = undefined;
        user.refreshToken = undefined;

        // return response
        return res.status(200).json({
            success: true,
            message: "User registered successfully",
            user,
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};

exports.login = async (req, res) => {
    try {
        //take input from req.body
        const { email, username, password } = req.body;

        //validation
        if (!username && !email) {
            return res.status(400).json({
                success: false,
                message: "Username or email is required!",
            });
        }

        if (!password) {
            return res.status(400).json({
                success: false,
                message: "password is required!",
            });
        }

        // find the user in db
        const user = await User.findOne({
            $or: [{ username }, { email }],
        });

        //if user doesn't exist
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        // password check
        const isPasswordValid = await user.isPasswordCorrect(password);

        //wrong password -- return
        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: "Password incorrect!",
            });
        }

        //generate Access Token, Refresh Token
        const { accessToken, refreshToken } =
            await generateAccessAndRefreshToken(user._id);

        const loggedInUser = await User.findById(user._id).select(
            "-password -refreshToken"
        );

        //send cookies & response
        const options = {
            httpOnly: true,
            secure: true,
        };

        return res
            .status(200)
            .cookie("access_token", accessToken, options)
            .cookie("refresh_token", refreshToken, options)
            .json({
                success: true,
                message: "User logged in successfully!",
                user: loggedInUser,
                accessToken,
                refreshToken,
            });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};

exports.logout = async (req, res) => {
    try {
        const userId = req.user._id;

        //make refresh token null in db
        await User.findByIdAndUpdate(userId, {
            $set: {
                refreshToken: undefined,
            },
        });

        //clear cookies
        const options = {
            httpOnly: true,
            secure: true,
        };

        return res
            .status(200)
            .clearCookie("access_token", options)
            .clearCookie("refresh_token", options)
            .json({
                success: true,
                message: "User Logged out!",
            });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};

exports.refreshAccessToken = async (req, res) => {
    try {
        // fetch refresh token from req
        const incomingRefreshToken =
            req.cookies?.refresh_token || req.body?.refresh_token;

        //validation
        if (!incomingRefreshToken) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized request",
            });
        }

        // fetch userId from decoded token
        const decodedToken = jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        );

        // find user by that id
        const user = await User.findById(decodedToken?._id);

        //if user doesn't exist
        if (!user) {
            return res.status(401).json({
                success: false,
                message: "Invalid refresh token",
            });
        }

        // check if both refresh tokens are matching
        if (incomingRefreshToken !== user?.refreshToken) {
            return res.status(401).json({
                success: false,
                message: "Refresh token is expired or used",
            });
        }

        //generate new access & refresh token
        const { accessToken, refreshToken } =
            await generateAccessAndRefreshToken(user._id);

        //return response & send cookie
        const options = {
            httpOnly: true,
            secure: true,
        };

        return res
            .status(200)
            .cookie("access_token", accessToken, options)
            .cookie("refresh_token", refreshToken, options)
            .json({
                success: true,
                message: "Access token refreshed!",
                accessToken,
                refreshToken,
            });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};

exports.changeCurrentPassword = async (req, res) => {
    try {
        const { oldPassword, newPassword } = req.body;
        const userId = req.user?._id;

        const user = await User.findById(userId);
        const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);

        if (!isPasswordCorrect) {
            return res.status(400).json({
                success: false,
                message: "Wrong password",
            });
        }

        user.password = newPassword;
        await user.save({ validateBeforeSave: false }); // no validation

        return res.status(200).json({
            success: true,
            message: "Password changed successfully!",
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};

exports.getCurrentuser = (req, res) => {
    const user = req.user;
    return res.status(200).json({
        success: true,
        message: "Current user fetched successfully!",
        user,
    });
};

exports.updateAccountDetails = async (req, res) => {
    try {
        const { fullName, email } = req.body;

        if (!fullName || !email) {
            return res.status(400).json({
                success: false,
                message: "All fields are required",
            });
        }

        const userId = req.user?._id;
        const user = await User.findByIdAndUpdate(
            userId,
            {
                $set: {
                    fullName: fullName,
                    email: email,
                },
            },
            { new: true }
        ).select("-password -refreshToken");

        return res.status(200).json({
            success: true,
            message: "Account details updated successfully!",
            user,
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};

exports.updateUserAvatar = async (req, res) => {
    try {
        const userId = req.user?._id;
        const avatarLocalPath = req.file?.path;

        if (!avatarLocalPath) {
            return res.status(400).json({
                success: false,
                message: "Avatar file is missing!",
            });
        }

        const avatar = await uploadOnCloudinary(avatarLocalPath);

        if (!avatar) {
            return res.status(400).json({
                success: false,
                message: "Error while uploading avatar",
            });
        }

        // TODO: Delete old image from cloudinary - assignment
        const user = await User.findById(userId);

        const oldUrl = user.avatar;
        await deleteFromCloudinary(oldUrl);

        // update the url
        const updatedUser = await User.findByIdAndUpdate(
            userId,
            {
                $set: {
                    avatar: avatar.url,
                },
            },
            { new: true }
        ).select("-password -refreshToken");

        return res.status(200).json({
            success: true,
            message: "Avatar updated successfully!",
            user: updatedUser,
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};

exports.updateUserCoverImage = async (req, res) => {
    try {
        const userId = req.user?._id;
        const coverImageLocalPath = req.file?.path;

        if (!coverImageLocalPath) {
            return res.status(400).json({
                success: false,
                message: "Cover Image file is missing",
            });
        }

        //upload new image to cloudinary
        const coverImage = await uploadOnCloudinary(coverImageLocalPath);

        if (!coverImage) {
            return res.status(400).json({
                success: false,
                message: "Error while uploading cover image",
            });
        }

        //delete old image from cloudinary
        const user = await User.findById(userId);
        await deleteFromCloudinary(user.coverImage);

        const updatedUser = await User.findByIdAndUpdate(
            userId,
            {
                $set: {
                    coverImage: coverImage.url,
                },
            },
            { new: true }
        ).select("-password -refreshToken");

        return res.status(200).json({
            success: true,
            message: "Cover image updated successfully!",
            user: updatedUser,
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};

exports.getUserChannelProfile = async (req, res) => {
    try {
        const { username } = req.params;

        if (!username?.trim()) {
            return res.status(400).json({
                success: false,
                message: "Channel username is missing!",
            });
        }

        const channel = await User.aggregate([
            {
                $match: {
                    username: username,
                },
            },
            {
                $lookup: {
                    from: "subscriptions",
                    localField: "_id",
                    foreignField: "channel",
                    as: "subscribers",
                },
            },
            {
                $lookup: {
                    from: "subscriptions",
                    localField: "_id",
                    foreignField: "subscriber",
                    as: "subscribedTo",
                },
            },
            {
                $addFields: {
                    subscribersCount: {
                        $size: "$subscribers",
                    },
                    channelsSubscribedToCount: {
                        $size: "$subscribedTo",
                    },
                    isSubscribed: {
                        $cond: {
                            if: {
                                $in: [
                                    new mongoose.Types.ObjectId(req.user._id),
                                    "$subscribers.subscriber",
                                ],
                            },
                            then: true,
                            else: false,
                        },
                    },
                },
            },
            {
                $project: {
                    fullName: 1,
                    username: 1,
                    subscribersCount: 1,
                    channelsSubscribedToCount: 1,
                    isSubscribed: 1,
                    avatar: 1,
                    coverImage: 1,
                    email: 1
                },
            },
        ]);

        if (!channel?.length) {
            return res.status(404).json({
                success: false,
                message: "Channel does not exist",
            });
        }

        return res.status(200).json({
            success: true,
            message: "Channel fetched successfully",
            channel: channel[0],
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};

// Testing PENDING
exports.getWatchHistory = async (req, res) => {
    try {
        const userId = req.user?._id;

        const user = await User.aggregate([
            {
                $match: {
                    _id: userId,
                },
            },
            {
                $lookup: {
                    from: "videos",
                    localField: "watchHistory",
                    foreignField: "_id",
                    as: "watchHistory",
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
                                            fullName: 1,
                                            username: 1,
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
                        },
                    ],
                },
            },
        ]);

        return res.status(200).json({
            success: true,
            message: "Watch History fetched successfully!",
            watchHistory: user[0].watchHistory,
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};
