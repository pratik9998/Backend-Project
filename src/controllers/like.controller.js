import {asyncHandler} from "../utils/asyncHandler.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {Like} from "../models/like.model.js"
import mongoose from "mongoose"

const toggleVideoLike = asyncHandler (async (req, res) => {
    try {
        let {videoId} = req.params
        videoId = videoId?.trim();

        const alreadyLiked = await Like.findOne({
            video : new mongoose.Types.ObjectId(videoId),
            likedBy : req.user?._id
        })

        if (!alreadyLiked) {
            await Like.create({
                video : new mongoose.Types.ObjectId(videoId),
                likedBy : req.user?._id
            })
        }
        else {
            await Like.findByIdAndDelete(alreadyLiked?._id)
        }
        
        return res.status(201)
        .json(new ApiResponse (200, {}, "video like changed successfully"))

    } catch (error) {
        throw new ApiError(400, `error while changing video like: ${error}`);
        
    }
})

const toggleCommentLike = asyncHandler (async (req, res) => {
    try {
        let {commentId} = req.params
        commentId = commentId?.trim();

        const alreadyLiked = await Like.findOne({
            comment : new mongoose.Types.ObjectId(commentId),
            likedBy : req.user?._id
        })

        if (!alreadyLiked) {
            await Like.create({
                comment : new mongoose.Types.ObjectId(commentId),
                likedBy : req.user?._id
            })
        }
        else {
            await Like.findByIdAndDelete(alreadyLiked?._id)
        }
        
        return res.status(201)
        .json(new ApiResponse (200, {}, "comment like changed successfully"))

    } catch (error) {
        throw new ApiError(400, `error while changing comment like: ${error}`);
        
    }
})

const getLikedVideos = asyncHandler (async (req, res) => {
    try {
        let {page = 1, limit = 5} = req.query

        page = parseInt(page)
        limit = parseInt(limit)
        const skip = (page - 1)*limit

        const videos = await Like.aggregate([
            {
                $match : {
                    likedBy : req.user?._id,
                    video: { $ne: null }
                }
            },
            {
                $lookup : {
                    from : "videos",
                    localField : "video",
                    foreignField : "_id",
                    as : "videoDetails"
                }
            },
            {
                $unwind: "$videoDetails" 
            },
            {
                $lookup: {
                    from: "users",
                    localField: "videoDetails.owner",
                    foreignField: "_id",
                    as: "ownerDetails"
                }
            },
            {
                $project : {
                    _id : "$videoDetails._id",
                    videoFile :"$videoDetails.videoFile",
                    thumbnail : "$videoDetails.thumbnail",
                    title : "$videoDetails.title",
                    description : "$videoDetails.description",
                    duration : "$videoDetails.duration",
                    views : "$videoDetails.views",
                    username : "$ownerDetails.username",
                    avatar : "$ownerDetails.avatar",
                }
            },
            {$skip : skip},
            {$limit : limit}
        ])

        return res.status(200)
        .json(new ApiResponse (200, videos, "Liked Videos fetched"))

    } catch (error) {
        throw new ApiError (400, `error while getting all liked videos: ${error}`)
    }
})

export {toggleVideoLike,
        toggleCommentLike,
        getLikedVideos
}