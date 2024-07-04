const jwt = require("jsonwebtoken")
const User = require("../models/user.model")
require("dotenv").config()

exports.verifyJWT = async(req, res, next) => {
    try {
        const token = req.cookies?.access_token || req.header("Authorization")?.replace("Bearer ", "")

        if(!token) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized request"
            })
        }

        const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)

        const user = await User.findById(decoded?._id).select("-password -refreshToken")

        if(!user) {
            return res.status(401).json({
                success: false,
                message: "Invalid Access Token"
            })
        }

        req.user = user
        next()
    } 
    catch (error) {
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        })
    }
}