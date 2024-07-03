const User = require("../models/user.model");
const uploadOnCloudinary = require("../utils/cloudinary");

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
        console.log(req.files);
        const avatarLocalPath = req.files?.avatar[0]?.path;
        const coverImageLocalPath = req.files?.coverImage[0]?.path

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