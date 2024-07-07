const express = require("express")
const { verifyJWT } = require("../middlewares/auth.middleware")
const { createTweet, getUserTweets, updateTweet, deleteTweet } = require("../controllers/tweet.controller")
const router = express.Router()

router.get("/u/:userId", getUserTweets)
router.post("/", verifyJWT, createTweet)
router.patch("/:tweetId", verifyJWT, updateTweet)
router.delete("/:tweetId", verifyJWT, deleteTweet)

module.exports = router