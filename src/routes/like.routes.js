const express = require("express")
const { verifyJWT } = require("../middlewares/auth.middleware")
const { toggleVideoLike, toggleCommentLike, toggleTweetLike, getLikedVideos } = require("../controllers/like.controller")
const router = express.Router()

router.post("/toggle/v/:videoId", verifyJWT, toggleVideoLike)
router.post("/toggle/c/:commentId", verifyJWT, toggleCommentLike)
router.post("/toggle/t/:tweetId", verifyJWT, toggleTweetLike)
router.get("/video", verifyJWT, getLikedVideos)

module.exports = router