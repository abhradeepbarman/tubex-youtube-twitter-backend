const express = require("express")
const { register, login, logout, refreshAccessToken, changeCurrentPassword, getCurrentuser, updateAccountDetails, updateUserAvatar, updateUserCoverImage, getUserChannelProfile, getWatchHistory } = require("../controllers/user.controller.js")
const { upload } = require("../middlewares/multer.middleware.js")
const { verifyJWT } = require("../middlewares/auth.middleware.js")
const router = express.Router()

router.post("/register", upload.fields([
    {
        name: "avatar",
        maxCount: 1
    },
    {
        name: "coverImage",
        maxCount: 1
    }
]), register)
router.post("/login", login)
router.post("/logout", verifyJWT, logout)
router.post("/refresh-token", refreshAccessToken)
router.patch("/change-password", verifyJWT, changeCurrentPassword)
router.get("/current-user", verifyJWT, getCurrentuser)
router.patch("/update-account-details", verifyJWT, updateAccountDetails)

router.patch("/update-avatar", verifyJWT, upload.single("avatar"), updateUserAvatar)
router.patch("/update-cover-image", verifyJWT, upload.single("coverImage"), updateUserCoverImage)
router.get("/channel/:username", verifyJWT, getUserChannelProfile)

// Testing PENDING 
router.get("/watch-history", verifyJWT, getWatchHistory)


module.exports = router