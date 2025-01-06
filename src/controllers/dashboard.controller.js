import {asyncHandler} from "../utils/asyncHandler.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {Video} from "../models/video.model.js"
import {Subscription} from "../models/subscription.model.js"
import {Like} from "../models/like.model.js"
import {Comment} from "../models/comment.model.js"

//pratik123 -> eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI2NzZiOWE3NmYxMjFlNjIyZjMwOTM1MjQiLCJlbWFpbCI6ImNAaGMuY29tIiwidXNlcm5hbWUiOiJwcmF0aWsxMjMiLCJmdWxsTmFtZSI6IlByYXRpayBTYXJ2YWl5YSIsImlhdCI6MTczNjE0MjcxNywiZXhwIjoxNzM2MjI5MTE3fQ.I3Lk88xeCzuF4zsl6iDbE9Q0IV5Rq-ZVnQaGD5E-Pio

//tourist -> eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI2Nzc3NzM2OTJiZGU4ZTg4ZGY5ZGVhMTciLCJlbWFpbCI6InRvdXJpc3RAcHMuY29tIiwidXNlcm5hbWUiOiJ0b3VyaXN0IiwiZnVsbE5hbWUiOiJnZW5uYWR5IGtvcm90a2V2aWNoIiwiaWF0IjoxNzM2MTQ0ODI0LCJleHAiOjE3MzYyMzEyMjR9.PRmzVVZ_bDxzIJOAKl3UFd9cLC-242oU6ZlVNk3Rb8g

//nealwu -> eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI2Nzc3NzYzODUyMjMxMjk5ZDI0YjE1YzIiLCJlbWFpbCI6Im5lYWx3dUBwcy5jb20iLCJ1c2VybmFtZSI6Im5lYWx3dSIsImZ1bGxOYW1lIjoibmVhbCB3dSIsImlhdCI6MTczNjE0NDg2NiwiZXhwIjoxNzM2MjMxMjY2fQ.cWMTzvp3p2KmEZzbv3v2_gUBD8GteJZ2CNui6MlnDKk

const getChannelStats = asyncHandler ( async (req, res) => {
    try {
        const userId = req.user?._id
        //total #subscriber, total #views, total #videos, total #likes

        const videoStats = await Video.aggregate([
            {
                $match : {owner : userId}
            },
            {
                $group : {
                    _id : null,
                    totalVideos : {$sum : 1},
                    totalViews : {$sum : "$views"}
                }
            }
        ])

        const subscriberCount = await Subscription.countDocuments({channel : userId})

        const totalVideoLikes = await Like.countDocuments({
            video : {$in : await Video.find({owner : userId}).distinct("_id")}
        })

        const totalCommentLikes = await Comment.countDocuments({
            comment : {$in : await Comment.find({owner : userId}).distinct("_id")}
        })

        const stats = {
            totalSubscriber : subscriberCount,
            totalViews : videoStats[0]?.totalViews || 0,
            totalVideos : videoStats[0]?.totalVideos || 0,
            totalVideoLikes : totalVideoLikes || 0,
            totalCommentLikes : totalCommentLikes || 0
        }

        return res.status(200)
        .json(new ApiResponse (200, stats, "stats fetched successfully"))

    } catch (error) {
        throw new ApiError(400, `error while getting video stats: ${error}`);
        
    }
})

const getAllVideos = asyncHandler ( async (req, res) => {
    try {
        let {page = 1, limit = 5} = req.query

        const userId = req.user?._id
        page = parseInt(page)
        limit = parseInt(limit)
        const skip = (page - 1)*limit

        const videos = await Video.find({owner : userId}).skip(skip).limit(limit)

        return res.status(200)
        .json(new ApiResponse(200, videos, "videos fetched successfully"))

    } catch (error) {
        throw new ApiError(400, `error while getting videos: ${error}`);
    }
})

export {
    getChannelStats,
    getAllVideos
}