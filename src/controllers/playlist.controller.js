import {asyncHandler} from "../utils/asyncHandler.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {Playlist} from "../models/playlist.model.js"
import {Video} from "../models/video.model.js"

const createPlaylist = asyncHandler (async (req, res) => {
    try {
        const {name, description = ""} = req.body
        if (!name) {
            throw new ApiError (401, "playlist name is required")
        }
        if (!req.user?._id) {
            throw new ApiError (401, "unauthorized request")
        }

        const playlist = await Playlist.create({
            name : name,
            description : description,
            owner : req.user?._id
        })

        return res.status(201)
        .json(new ApiResponse (201, playlist, "playlist created successfully"))
    } catch (error) {
        throw new ApiError(401, `something went wrong while creating playlist: ${error}`)
    }
})

const deletePlaylist = asyncHandler (async (req, res) => {
    try {
        const {playlistId} = req.params
        const playlist = await Playlist.findById(playlistId)
        if (!playlist) {
            throw new ApiError (401, "Playlist doesn't exist")
        }

        await Playlist.findByIdAndDelete(playlistId)
         
        return res.status(201)
        .json( new ApiResponse (201, {}, "playlist deleted successfully"))
    } catch (error) {
        throw new ApiError(401, `something went wrong while deleting playlist: ${error}`)
    }
})

const getPlaylistById = asyncHandler ( async (req, res) => {
    try {
        const {playlistId} = req.params
        const playlist = await Playlist.findById(playlistId)

        if (!playlist) {
            throw new ApiError (401, "playlist doesn't exist")
        }

        return res.status(201).json(new ApiResponse (201, playlist, "playlist fetched"))
    } catch (error) {
        throw new ApiError (401 , `something went wrong while getting playlist by id: ${error}`)
    }
})

const updatePlaylist = asyncHandler (async (req, res) => {
    try {
        let {playlistId} = req.params
        let {newName, newDescription} = req.body

        if ((!newName?.trim()) && (!newDescription?.trim())) {
            throw new ApiError(401, "new name can't be empty")
        }
        
        newName = newName?.trim()
        newDescription = newDescription?.trim()
        playlistId = playlistId?.trim()

        const existingPlaylist = await Playlist.findById(playlistId)
        if (!existingPlaylist) {
            throw new ApiError (401, "playlist doesn't exist")
        }
        
        let newCorrectName = existingPlaylist.name
        let newCorrectDescription = existingPlaylist.description
        if (newName) {
            newCorrectName = newName
        }
        if (newCorrectDescription) {
            newCorrectDescription = newDescription
        }

        const newPlaylist = await Playlist.findByIdAndUpdate(
            playlistId,
            {
                $set : {
                    name : newCorrectName,
                    description : newCorrectDescription
                }
            },
            {new : true}
        )

        return res.status(200)
        .json(
            new ApiResponse (200, newPlaylist, "playlist updated successfully")
        )

    } catch (error) {
        throw new ApiError (401, `error while updating playlist: ${error}`)
    }
})

const getUserPlaylists = asyncHandler (async (req, res) => {
    try {
        const {userId} = req.params

        const playlists = await Playlist.find({owner : userId}).select("-owner")

        return res.status(200)
        .json(
            new ApiResponse (200, playlists, "Playlists fetched successfully")
        )

    } catch (error) {
        throw new ApiError (401, `error while getting user's playlists: ${error}`)
    }
})

const addVideoToPlaylist = asyncHandler (async (req, res) => {
    try {
        // console.log(req.params)
        const {videoId, playlistId} = req.params
        // console.log(videoId)
        // console.log(playlistId)
        
        const existingVideo = await Video.findById(videoId)
        if (!existingVideo) {
            throw new ApiError (401, "video doesn't exist")
        }

        const playlist = await Playlist.findById(playlistId)
        if (!playlist) {
            throw new ApiError (401, "playlist doesn't exist")
        }
        
        if (playlist.videos.includes(videoId)) {
            throw new ApiError (401, "video is already in given playlist")
        }

        playlist.videos.push(videoId)
        await playlist.save()

        // console.log(playlist.videos)

        return res.status(201)
        .json(new ApiResponse (201, playlist, "video added to playlist successfully"))

    } catch (error) {
        throw new ApiError (400, `error while adding video to playlist: ${error}`)
    }
})

const removeVideoFromPlaylist = asyncHandler (async (req, res) => {
    try {
        // console.log(req.params)
        const {videoId, playlistId} = req.params
        // console.log(videoId)
        // console.log(playlistId)
        
        const existingVideo = await Video.findById(videoId)
        if (!existingVideo) {
            throw new ApiError (401, "video doesn't exist")
        }

        const playlist = await Playlist.findById(playlistId)
        if (!playlist) {
            throw new ApiError (401, "playlist doesn't exist")
        }
        
        if (!playlist.videos.includes(videoId)) {
            throw new ApiError (401, "video doesn't belong to given playlist")
        }

        const index = playlist.videos.indexOf(videoId);
        playlist.videos.splice(index,1)
        await playlist.save()

        console.log(playlist.videos)

        return res.status(201)
        .json(new ApiResponse (201, playlist, "video removed from playlist successfully"))

    } catch (error) {
        throw new ApiError (400, `error while adding video to playlist: ${error}`)
    }
})

export {createPlaylist,
        deletePlaylist,
        getPlaylistById,
        updatePlaylist,
        getUserPlaylists,
        addVideoToPlaylist,
        removeVideoFromPlaylist
}