const express = require("express")
const { toggleSubscription, getSubscribedChannels, getUserChannelSubscribers } = require("../controllers/subscription.controller")
const { verifyJWT } = require("../middlewares/auth.middleware")
const router = express.Router()

router.post("/c/:channelId", verifyJWT, toggleSubscription)
router.get("/u/:subscriberId", verifyJWT, getSubscribedChannels)
router.get("/c/:channelId", verifyJWT, getUserChannelSubscribers);

module.exports = router