const express = require("express")
const { verifyJWT } = require("../middlewares/auth.middleware")
const { upload } = require("../middlewares/multer.middleware")
const { publishVideo, getVideoById, updateVideo, deleteVideo, togglePublishStatus, getAllVideos } = require("../controllers/video.controller")
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

// get video by id
router.get("/:videoId", verifyJWT, getVideoById)

// update video (title, description, thumbnail)
router.patch("/update/:videoId", verifyJWT, upload.single("thumbnail"), updateVideo)

// toggle publish status
router.patch("/toggle/publish/:videoId", verifyJWT, togglePublishStatus)

// delete video
router.delete("/delete/:videoId", verifyJWT, deleteVideo)

// get all video
router.get("/", getAllVideos)

module.exports = router