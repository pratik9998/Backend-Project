import {asyncHandler} from "../utils/asyncHandler.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {Comment} from "../models/comment.model.js"
import {Video} from "../models/video.model.js"
import {User} from "../models/user.model.js"
import mongoose from "mongoose"

const addComment = asyncHandler (async (req, res) => {
    try {

        let {videoId} = req.params
        let {content} = req.body

        videoId = videoId?.trim()
        content = content?.trim()

        if (!content) {
            throw new ApiError (400, "content required")
        }

        const video = await Video.findById(videoId)
        if (!video) {
            throw new ApiError (400, "video doesn't exist")
        }

        const comment = await Comment.create({
            content : content,
            video : videoId,
            owner : req?.user?._id
        })

        return res.status(201)
        .json(new ApiResponse (201, comment, "comment added successfully"))

    } catch (error) {
        throw new ApiError(400, `error while adding comment: ${error}`)
        
    }
})

const getVideoComments = asyncHandler (async (req, res) => {
    try {
        
        let {videoId} = req.params
        let {page = 1, limit = 5} = req.query

        page = parseInt(page)
        limit = parseInt(limit)
        let skip = (page-1)*limit

        videoId = videoId?.trim()

        const video = await Video.findById(videoId)
        if (!video) {
            throw new ApiError (400, "video doesn't exist")
        }

        const comments = await Comment.aggregate([
            {
                $match : {video : new mongoose.Types.ObjectId(videoId)}
            },
            {
                $lookup : {
                    from : "users",
                    localField : "owner",
                    foreignField : "_id",
                    as : "ownerDetails"
                }
            },
            {
                $project : {
                    _id : 1,
                    content : 1,
                    username : "$ownerDetails.username",
                    avatar : "$ownerDetails.avatar",
                    createdAt : 1
                }
            },
            {$skip : skip},
            {$limit : limit}
        ])

        return res.status(201)
        .json(new ApiResponse (201, comments, "comments fetched successfully"))

    } catch (error) {
        throw new ApiError (400, `error while getting video comments: ${error}`)
    }
})

const deleteComment = asyncHandler (async (req, res) => {
    try {

        let {commentId} = req.params
        commentId = commentId?.trim()

        const comment = await Comment.findById(commentId) 
        if (!comment) {
            throw new ApiError (400, "comment doesn't exist")
        }

        await Comment.findByIdAndDelete(commentId)

        return res.status(200)
        .json(new ApiResponse (200, {}, "comment deleted successfully"))

    } catch (error) {
        throw new ApiError (400, `error while deleting comment: ${error}`)
    }
})

const updateComment = asyncHandler (async (req, res) => {
    try {

        let {commentId} = req.params
        let {newContent} = req.body
        commentId = commentId?.trim()
        newContent = newContent?.trim()

        const comment = await Comment.findById(commentId) 
        if (!comment) {
            throw new ApiError (400, "comment doesn't exist")
        }

        if (!newContent) {
            throw new ApiError (400, "content required")
        }

        comment.content = newContent
        await comment.save()

        return res.status(200)
        .json(new ApiResponse (200, comment, "comment updated successfully"))

    } catch (error) {
        throw new ApiError (400, `error while deleting comment: ${error}`)
    }
})

export {addComment,
        getVideoComments,
        deleteComment,
        updateComment
}