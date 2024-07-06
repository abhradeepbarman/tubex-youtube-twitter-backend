const express = require("express")
const { verifyJWT } = require("../middlewares/auth.middleware")
const { upload } = require("../middlewares/multer.middleware")
const { publishVideo } = require("../controllers/video.controller")
const router = express.Router()


// publish video
router.post("/publish-video", verifyJWT, upload.fields([
    {
        name: "videoFile",
        maxCount: 1
    },
    {
        name: "thumbnail",
        maxCount: 1
    }
]), publishVideo)

// get all video
// get video by id
// update video (thumbnail)
// delete video
// toggle publish status

module.exports = router