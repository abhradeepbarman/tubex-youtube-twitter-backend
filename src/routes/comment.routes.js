const { getVideoComments, addComment, deleteComment, updateComment } = require("../controllers/comment.controller")
const { verifyJWT } = require("../middlewares/auth.middleware")
const router = require("express").Router()

router.get("/:videoId", verifyJWT, getVideoComments)
router.post("/:videoId", verifyJWT, addComment)
router.patch("/c/:commentId", verifyJWT, updateComment)
router.delete("/c/:commentId", verifyJWT, deleteComment)

module.exports = router