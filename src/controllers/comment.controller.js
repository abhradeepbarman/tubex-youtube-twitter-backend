const { default: mongoose } = require("mongoose");
const Comment = require("../models/comment.model");
const Video = require("../models/video.model");
const Like = require("../models/like.model");

exports.getVideoComments = async (req, res) => {
    try {
        //TODO: get all comments for a video
        const {videoId} = req.params
        const {page = 1, limit = 10} = req.query

        //validation
        const video = await Video.findById(videoId)

        if(!video) {
            return res.status(400).json({
                success: false,
                message: "Invalid video ID"
            })
        }

        // we should see comments, owner of those comments (username, fullName, avatar, cover pic), likes on those comments etc.
    
        const aggregatedComments = Comment.aggregate([
            {
                $match: {
                    video: new mongoose.Types.ObjectId(videoId)
                }
            },
            {
                $lookup: {
                    from: "users",
                    localField: "owner",
                    foreignField: "_id",
                    as: "owner",
                    pipeline: [
                        {
                            $project: {
                                "username": 1,
                                "fullName": 1,
                                "avatar": 1,
                                "coverImage": 1
                            }
                        }
                    ]
                }
            },
            {
                $lookup: {
                    from: "likes",
                    localField: "_id",
                    foreignField: "comment",
                    as: "likes"
                }
            },
            {
                $addFields: {
                    likes: {
                        $size: "$likes"
                    }
                }
            }
        ])

        const options = {
            page: page,
            limit: limit
        }

        const comments = await Comment.aggregatePaginate(aggregatedComments, options)

        if(!comments) {
            return res.status(500).json({
                success: false,
                message: "Error while fetching video Comments"
            })
        }

        return res.status(200).json({
            success: true,
            message: "Comments of video is fetched successfully!",
            comments
        })
    } 
    catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        })
    }
}

exports.addComment = async (req, res) => {
    try {
        // TODO: add a comment to a video
        const {videoId} = req.params
        const userId = req.user._id
        const {content} = req.body

        //validation
        if(!content) {
            return res.status(400).json({
                success: false,
                message: "Content is required"
            })
        }

        const video = await Video.findById(videoId)

        if(!video) {
            return res.status(400).json({
                success: false,
                message: "Invalid video ID"
            })
        }

        //create comment
        const comment = await Comment.create({
            content,
            video: videoId,
            owner: userId
        })

        //validation
        if(!comment) {
            return res.status(500).json({
                success: false,
                message: "Error while adding comment"
            })
        }

        //return response
        return res.status(200).json({
            success: true,
            message: "Comment added successfully!",
            comment
        })
    } 
    catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        })
    }
}

exports.updateComment = async (req, res) => {
    try {
        // TODO: update a comment
        const {commentId} = req.params
        const {content} = req.body
        const userId = req.user._id

        //validation
        const comment = await Comment.findById(commentId)

        if(!comment) {
            return res.status(400).json({
                success: false,
                message: "Invalid Comment ID"
            })
        }

        if(comment.owner.toString() !== userId.toString()) {
            return res.status(400).json({
                success: false,
                message: "Invalid request"
            })
        }

        //update
        const updatedComment = await Comment.findByIdAndUpdate(
            commentId,
            {
                content: content
            }
        )

        //validation
        if(!updatedComment) {
            return res.status(500).json({
                success: false,
                message: "Error while updating comment"
            })
        }

        //return response
        return res.status(200).json({
            success: true,
            message: "Comment updated successfully",
            updatedComment
        })
    } 
    catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        })
    }
}

exports.deleteComment = async (req, res) => {
    try {
        // TODO: delete a comment
        const {commentId} = req.params
        const userId = req.user._id

        //validation
        const comment = await Comment.findById(commentId)

        if(!comment) {
            return res.status(400).json({
                success: false,
                message: "Invalid Comment ID"
            })
        }

        if(comment.owner.toString() !== userId.toString()) {
            return res.status(400).json({
                success: false,
                message: "Invalid request"
            })
        }

        //delete all likes on that comment
        const deletedLikesOfComment = await Like.findOneAndDelete({
            comment: commentId
        })

        //validation
        if(!deletedLikesOfComment) {
            return res.status(500).json({
                success: false,
                message: "Error while deleting likes of comments"
            })
        } 

        //delete comment
        const deletedComment = await Comment.findByIdAndDelete(commentId)

        //validation
        if(!deletedComment) {
            return res.status(500).json({
                success: false,
                message: "Error while deleting comment"
            })
        }

        //return res
        return res.status(200).json({
            success: true,
            message: "Comment deleted successfully!",
            deletedComment
        })

    } catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        })
    }
}