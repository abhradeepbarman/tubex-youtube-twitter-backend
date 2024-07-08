const { getChannelStats, getChannelVideos } = require("../controllers/dashboard.controller");
const { verifyJWT } = require("../middlewares/auth.middleware");
const router = require("express").Router()

router.get("/stats", verifyJWT, getChannelStats);
router.get("/videos", verifyJWT, getChannelVideos);

module.exports = router