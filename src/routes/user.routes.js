const express = require("express")
const { register, login, logout, refreshAccessToken } = require("../controllers/user.controller.js")
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

//secured routes
router.post("/logout", verifyJWT, logout)
router.post("/refresh-token", refreshAccessToken)

module.exports = router