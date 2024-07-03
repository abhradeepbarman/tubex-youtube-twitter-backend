const express = require("express")
const { register } = require("../controllers/user.controller.js")
const { upload } = require("../middlewares/multer.middleware.js")
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

module.exports = router