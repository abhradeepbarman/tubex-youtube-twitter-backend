const { createPlaylist, getPlaylistById, updatePlaylist, deletePlaylist, addVideoToPlaylist, removeVideoFromPlaylist, getUserPlaylists } = require("../controllers/playlist.controller")
const { verifyJWT } = require("../middlewares/auth.middleware")
const router = require("express").Router()

router.post("/", verifyJWT, createPlaylist)
router.patch("/:playlistId", verifyJWT, updatePlaylist)
router.delete("/:playlistId", verifyJWT, deletePlaylist)

router.patch("/add/:videoId/:playlistId", verifyJWT, addVideoToPlaylist)
router.patch("/remove/:videoId/:playlistId", verifyJWT, removeVideoFromPlaylist)

router.get("/:playlistId", verifyJWT, getPlaylistById)
router.get("/u/:userId", verifyJWT, getUserPlaylists)

module.exports = router