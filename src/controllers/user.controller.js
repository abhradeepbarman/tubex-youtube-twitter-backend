const User = require("../models/user.model");
const uploadOnCloudinary = require("../utils/cloudinary");
const jwt = require("jsonwebtoken")
require("dotenv").config()

const generateAccessAndRefreshToken = async(userId) => {
    try {
        const user = await User.findById(userId)

        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken
        await user.save({ validateBeforeSave: false })

        return {accessToken, refreshToken}

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        })
    }
}

exports.register = async(req, res) => {
    try {
        // get user details from req
        const {username, email, fullName, password} = req.body;

        // validation - not empty
        if(!username || !email || !fullName || !password) {
            return res.status(400).json({
                success: false,
                message: "All fields are required"
            })
        }

        // check if user already exists: username, email
        const existingUser = await User.findOne({
            $or: [{username}, {email}]
        })

        if(existingUser) {
            return res.status(409).json({
                success: false,
                message: "User with email or username already exists"
            })
        }
        
        // check for image, check for avatar(imp)
        // console.log(req.files);
        const avatarLocalPath = req.files?.avatar[0]?.path;
        // const coverImageLocalPath = req.files?.coverImage[0]?.path

        let coverImageLocalPath;
        if(req.files && Array.isArray(req.files?.coverImage) && req.files?.coverImage.length > 0) {
            coverImageLocalPath = req.files.coverImage[0].path
        }

        if(!avatarLocalPath) {
            return res.status(400).json({
                success: false, 
                message: "Avatar is required"
            })
        }

        // upload them to cloudinary
        const avatar = await uploadOnCloudinary(avatarLocalPath)
        const coverImage = await uploadOnCloudinary(coverImageLocalPath)

        if(!avatar) {
            return res.status(400).json({
                success: false,
                message: "Avatar not found"
            })
        }

        // create user
        const user = await User.create({
            username: username.toLowerCase(),
            email,
            fullName,
            password,
            avatar: avatar.url,
            coverImage: coverImage?.url || ""
        })

        // check for user creation
        const newUser = await User.findById(user._id)

        if(!newUser) {
            return res.status(500).json({
                success: false,
                message: "Something went wrong while registering the user"
            })
        }

        // remove password and refresh token field from response
        newUser.password = undefined
        newUser.refreshToken = undefined

        // return response
        return res.status(200).json({
            success: true,
            message: "User registered successfully",
            newUser
        })
    } 
    catch (error) {
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        })
    }
}

exports.login = async(req, res) => {
    try {
        //take input from req.body
        const {email, username, password} = req.body

        //validation
        if(!username && !email) {
            return res.status(400).json({
                success: false,
                message: "Username or email is required!"
            })
        }

        if(!password) {
            return res.status(400).json({
                success: false,
                message: "password is required!"
            })
        }

        // find the user in db
        const user = await User.findOne({
            $or: [{username}, {email}]
        })

        //if no user found -- return
        if(!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            })
        }

        // password check
        const isPasswordValid = await user.isPasswordCorrect(password)

        //wrong password -- return
        if(!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: "Password incorrect!"
            })
        }

        //generate Access Token, Refresh Token
        const {accessToken, refreshToken} = await generateAccessAndRefreshToken(user._id)

        const loggedInUser = await User.findById(user._id)
        loggedInUser.password = undefined
        loggedInUser.refreshToken = undefined
        
        //send cookies
        //return res
        const options = {
            httpOnly: true,
            secure: true
        }

        return res
                .status(200)
                .cookie("access_token", accessToken, options)
                .cookie("refresh_token", refreshToken, options)            
                .json({
                    success: true,
                    message: "User logged in successfully!",
                    user: loggedInUser,
                    accessToken, 
                    refreshToken
                })
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        })
    }
}

exports.logout = async(req, res) => {
    try {
        const userId = req.user._id
        
        //make refresh token null in db
        await User.findByIdAndUpdate(userId, 
            {
                $set: {
                    refreshToken: undefined
                },
            },
            {
                new: true
            }
        )

        //clear cookies
        const options = {
            httpOnly: true,
            secure: true
        }

        return res.status(200)
                .clearCookie("access_token", options)
                .clearCookie("refresh_token", options)
                .json({
                    success: false,
                    message: "User Logged out!"
                })
    } 
    catch (error) {
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        })
    }
}

exports.refreshAccessToken = async(req, res) => {
    try {
        const incomingRefreshToken = req.cookies?.refresh_token || req.body.refreshToken

        if(!incomingRefreshToken) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized request"
            })
        }

        const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET)

        const user = await User.findById(decodedToken?._id)

        if(!user) {
            return res.status(401).json({
                success: false,
                message: "Invalid refresh token"
            })
        }

        if(incomingRefreshToken !== user?.refreshToken) {
            return res.status(401).json({
                success: false,
                message: "Refresh token is expired or used"
            })
        }

        const {accessToken, refreshToken} = await generateAccessAndRefreshToken(user._id)

        const options = {
            httpOnly: true,
            secure: true
        }

        return res
                .status(200)
                .cookie("access_token", accessToken, options)
                .cookie("refresh_token", refreshToken, options)
                .json({
                    success: true,
                    message: "Access token refreshed!",
                    accessToken,
                    refreshToken
                })

    } catch (error) {
        console.log("error: ", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        })
    }
}

// Testing PENDING 
exports.changeCurrentPassword = async(req, res) => {
    try {
        const {oldPassword, newPassword} = req.body

        const userId = req.user?._id;
        const user = await User.findById(userId)
        const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)
        
        if(!isPasswordCorrect) {
            return res.status(400).json({
                success: false,
                message: "Wrong password"
            })
        }

        user.password = newPassword
        await user.save({validateBeforeSave: false})  // no validation

        return res.status(200).json({
            success: true,
            message: "Password changed successfully!"
        })
    } 
    catch (error) {
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        })
    }
}

exports.getCurrentuser = (req, res) => {
    const user = req.user;
    return res.status(200).json({
        success: true,
        message: "Current user fetched successfully!",
        user
    })
}

exports.updateAccountDetails = async(req, res) => {
    try {
        const {fullName, email} = req.body

        if(!fullName || !email) {
            return res.status(400).json({
                success: false,
                message: "All fields are required"
            })
        }

        const userId = req.user?._id
        const user = await User.findByIdAndUpdate(
            userId,
            {
                $set: {
                    fullName: fullName,
                    email: email,
                }
            },
            {new: true}
        ).select("-password")


        return res.status(200).json({
            success: true,
            message: "Account details updated successfully!",
            user
        })
    } 
    catch (error) {
        console.log("error: ", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        })
    }
}

exports.updateUserAvatar = async(req, res) => {
    try {
        const userId = req.user?._id;
        const avatarLocalPath = req.file?.path

        if(!avatarLocalPath) {
            return res.status(400).json({
                success: false,
                message: "Avatar file is missing"
            })
        }

        const avatar = await uploadOnCloudinary(avatarLocalPath)

        if(!avatar.url) {
            return res.status(400).json({
                success: false,
                message: "Error while uploading avatar"
            })
        }

        // TODO: Delete old image - assignment

        const user = await User.findByIdAndUpdate(
            userId, 
            {
                $set: {
                    avatar: avatar.url
                }
            },
            {new: true}
        ).select("-password -refreshToken")

        return res.status(200).json({
            success: true,
            message: "Avatar updated successfully!",
            user
        })
    } 
    catch (error) {
        console.log("error: ", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        })
    }
}

exports.updateUserCoverImage = async(req, res) => {
    try {
        const userId = req.user?._id;
        const coverImageLocalPath = req.file?.path

        if(!coverImageLocalPath) {
            return res.status(400).json({
                success: false,
                message: "COver Image file is missing"
            })
        }

        const coverImage = await uploadOnCloudinary(coverImageLocalPath)

        if(!coverImage.url) {
            return res.status(400).json({
                success: false,
                message: "Error while uploading cover image"
            })
        }

        const user = await User.findByIdAndUpdate(
            userId, 
            {
                $set: {
                    coverImage: coverImage.url
                }
            },
            {new: true}
        ).select("-password -refreshToken")

        return res.status(200).json({
            success: true,
            message: "Cover image updated successfully!",
            user
        })
    } 
    catch (error) {
        console.log("error: ", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        })
    }
}

exports.getUserChannelProfile = async(req, res) => {
    try {
        const {username} = req.params  

        if(!username?.trim()) {
            return res.status(400).json({
                success: false,
                message: "Channel username is missing!"
            })
        }

        const channel = await User.aggregate([
            {
                $match: {
                    username: username?.toLowerCase()
                }
            },
            {
                $lookup: {
                    from: "Subscription",
                    localField: "_id",
                    foreignField: "channel",
                    as: "subscribers"
                }
            },
            {
                $lookup: {
                    from: "Subscription",
                    localField: "_id",
                    foreignField: "subscriber",
                    as: "subscribedTo"
                }
            },
            {
                $addFields: {
                    subscribersCount: {
                        $size: "$subscribers"
                    },
                    channelsSubscribedToCount: {
                        $size: "subscribedTo"
                    },
                    isSubscribed: {
                        $cond: {
                            if: {$in: [req.user?._id, "$subscribers.subscriber"]},
                            then: true,
                            else: false
                        }
                    }
                }
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
                }
            }
        ])

        console.log("channel details", channel);

        if (!channel?.length) {
            return res.status(404).json({
                success: false,
                message: "Channel does not exist"
            })
        }

        return res.status(200).json({
            success: true,
            message: "Channel fetched successfully",
            channel: channel[0]
        })
    } 
    catch (error) {
        console.log("error: ", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        })
    }
}