const { default: mongoose } = require("mongoose")
const Playlist = require("../models/playlist.model")
const Video = require("../models/video.model")
const User = require("../models/user.model")

exports.createPlaylist = async (req, res) => {
    //TODO: create playlist
    try {
        const {name, description} = req.body
        const userId = req.user._id

        //validation
        if(!name || !description) {
            return res.status(400).json({
                success: false,
                message: "All fields are required"
            })
        }

        //create playlist
        const playlist = await Playlist.create({
            name,
            description,
            videos: [],
            owner: userId
        })

        //validation
        if(!playlist) {
            return res.status(500).json({
                success: false,
                message: "Error while creating playlist"
            })
        }

        //return response 
        return res.status(200).json({
            success: true,
            message: "Playlist created successfully!",
            playlist
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

exports.updatePlaylist = async (req, res) => {
    //TODO: update playlist
    try {
        const {playlistId} = req.params
        const {name, description} = req.body
        const userId = req.user._id

        // validation - playlist, name, description
        if(!name && !description) {
            return res.status(400).json({
                success: false,
                message: "Atleast one field is required"
            })
        }

        if(!playlistId) {
            return res.status(400).json({
                success: false,
                message: "Playlist ID is required"
            })
        }

        const playlist = await Playlist.findById(playlistId)

        if(!playlist) {
            return res.status(404).json({
                success: false,
                message: "Playlist not found"
            })
        }

        // match userId with ownerId
        if(playlist?.owner.toString() !== userId.toString()) {
            return res.status(400).json({
                success: false,
                message: "Invalid Request"
            })
        }

        // update
        if(name) {
            playlist.name = name
        }

        if(description) {
            playlist.description = description
        }

        const updatedPlaylist = await playlist.save({validateBeforeSave: false})

        // validation
        if(!updatedPlaylist) {
            return res.status(500).json({
                success: false,
                message: "Error while updating playlist"
            })
        }

        // return response
        return res.status(200).json({
            success: true,
            message: "Playlist updated successfully!",
            updatedPlaylist
        })
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        })
    }
}

exports.deletePlaylist = async (req, res) => {
    // TODO: delete playlist
    try {
        const {playlistId} = req.params
        const userId = req.user._id

        // validation
        if(!playlistId) {
            return res.status(400).json({
                success: false,
                message: "Playlist ID is required"
            })
        }

        const playlist = await Playlist.findById(playlistId)

        if(!playlist) {
            return res.status(404).json({
                success: false,
                message: "Playlist not found"
            })
        }

        // match userId with owner Id
        if(playlist.owner.toString() !== userId.toString()) {
            return res.status(400).json({
                success: false,
                message: "Invalid Request"
            })
        }

        // delete
        const deletedPlaylist = await Playlist.findByIdAndDelete(playlistId)

        // validation
        if(!deletedPlaylist) {
            return res.status(500).json({
                success: false,
                message: "Error while deleting playlist"
            })
        }

        // response
        return res.status(200).json({
            success: true,
            message: "Playlist deleted successfully",
            deletedPlaylist
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

exports.addVideoToPlaylist = async (req, res) => {
    try {
        const {playlistId, videoId} = req.params
        const userId = req.user._id

        // validation 
        if(!playlistId || !videoId) {
            return res.status(400).json({
                success: false,
                message: "All fields are required"
            })
        }

        // check playlist id is valid
        const playlist = await Playlist.findById(playlistId)

        if(!playlist) {
            return res.status(404).json({
                success: false,
                message: "Playlist not found"
            })
        }

        // check video id is valid
        const video = await Video.findById(videoId)

        if(!video) {
            return res.status(404).json({
                success: false,
                message: "Video not found"
            })
        }

        // owner match
        if(playlist.owner.toString() !== userId.toString()) {
            return res.status(400).json({
                success: false,
                message: "Inavlid Request"
            })
        }

        // check video is present in playlist or not -> if yes, no need to add video again
        if(playlist.videos.includes(videoId)) {
            return res.status(400).json({
                success: false,
                message: "Video is already added in playlist"
            })
        }

        // add video in playlist
        const updatedPlaylist = await Playlist.findByIdAndUpdate(
            playlistId,
            {
                $push: {
                    videos: videoId
                }
            },
            {new: true}
        )

        // validation
        if(!updatedPlaylist) {
            return res.status(500).json({
                success: false,
                message: "Error while adding video to playlist"
            })
        }

        // return response
        return res.status(200).json({
            success: true,
            message: "Video added in playlist successfully!",
            updatedPlaylist
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

exports.removeVideoFromPlaylist = async (req, res) => {
    // TODO: remove video from playlist
    try {
        const {playlistId, videoId} = req.params
        const userId = req.user._id

        // validation 
        if(!playlistId || !videoId) {
            return res.status(400).json({
                success: false,
                message: "All fields are required"
            })
        }

        // check playlist id is valid
        const playlist = await Playlist.findById(playlistId)

        if(!playlist) {
            return res.status(404).json({
                success: false,
                message: "Playlist not found"
            })
        }

        // check video id is valid
        const video = await Video.findById(videoId)

        if(!video) {
            return res.status(404).json({
                success: false,
                message: "Video not found"
            })
        }

        // owner match
        if(playlist.owner.toString() !== userId.toString()) {
            return res.status(400).json({
                success: false,
                message: "Inavlid Request"
            })
        }

        // check video is present in playlist or not -> if yes, no need to add video again
        if(!playlist.videos.includes(videoId)) {
            return res.status(400).json({
                success: false,
                message: "Video is not present in playlist"
            })
        } 
        
        // remove video in playlist
        const updatedPlaylist = await Playlist.findByIdAndUpdate(
            playlistId,
            {
                $pull: {
                    videos: videoId
                }
            },
            {new: true}
        )

        // validation
        if(!updatedPlaylist) {
            return res.status(500).json({
                success: false,
                message: "Error while removing video from playlist"
            })
        }

        // return response
        return res.status(200).json({
            success: true,
            message: "Video removed from playlist successfully!",
            updatedPlaylist
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

exports.getPlaylistById = async (req, res) => {
    // TODO: get playlist by id
    // we have to show - 
    // playlist name, desc, created at, updated at
    // owner fullName, username, avatar
    // videos
        // video id, thumbnail, videoUrl, title, description, 
                // video owner fullName, username, avatar, coverImage

    try {
        const {playlistId} = req.params

        // validation
        if(!playlistId) {
            return res.status(400).json({
                success: false,
                message: "Playlist ID is required"
            })
        }

        const playlist = await Playlist.findById(playlistId)

        if(!playlist) {
            return res.status(404).json({
                success: false,
                message: "Playlist not found"
            })
        }

        // fetch data
        const fetchedPlaylist = await Playlist.aggregate([
            {
                $match: {
                    _id: new mongoose.Types.ObjectId(playlistId)
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
                                "_id": 1,
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
                $addFields: {
                    owner: {
                        $first: "$owner"
                    }
                }
            },
            {
                $lookup: {
                    from: "videos",
                    localField: "videos",
                    foreignField: "_id",
                    as: "videos",
                    pipeline: [
                        {
                            $match: {
                                isPublished: true
                            }
                        },
                        {
                            $project: {
                                "_id": 1,
                                "videoFile": 1,
                                "thumbnail": 1,
                                "owner": 1,
                                "title": 1,
                                "description": 1,
                                "duration": 1,
                                "views": 1,
                                "createdAt": 1
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
                            $addFields: {
                                owner: {
                                    $first: "$owner"
                                }
                            }
                        }
                    ]
                }
            }
        ])

        // validation
        if(!fetchedPlaylist) {
            return res.status(500).json({
                success: false,
                message: "Error while fetching playlist"
            })
        }

        // response
        return res.status(200).json({
            success: true,
            message: "Playlist fetched successfully!",
            fetchedPlaylist
        })

    } catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        })
    }
}

exports.getUserPlaylists = async (req, res) => {
    //TODO: get user playlists
    //playlist name, description, created at, updated at, total no. of videos
    //thumbnail of first video
    try {
        const {userId} = req.params

        // validation
        if(!userId) {
            return res.status(400).json({
                success: false,
                message: "userId is required"
            })
        }

        const user = await User.findById(userId)

        if(!user) {
            return res.status(400).json({
                success: false,
                message: "Invalid User ID"
            })
        }

        // fetch user playlist
        const playlists = await Playlist.aggregate([
            {
                $match: {
                    owner: new mongoose.Types.ObjectId(userId)
                }
            },
            {
                $lookup: {
                    from: "videos",
                    localField: "videos",
                    foreignField: "_id",
                    as: "videos"
                }
            },
            {
                $addFields: {
                    totalVideos: {
                        $size: "$videos"
                    },
                    totalViews: {
                        $sum: "$videos.views"
                    }
                }
            }
        ])

        // validation
        if(!playlists) {
            return res.status(500).json({
                success: false,
                message: "Error while fetching playlists"
            })
        }

        // return response
        return res.status(200).json({
            success: true,
            message: "Playlists fetched successfully",
            playlists
        })

    } catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        })
    }
}