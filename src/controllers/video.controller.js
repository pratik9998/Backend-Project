import { ApiError } from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import {uploadOnCloudinary, deleteFromCloudinary} from "../utils/cloudinary.js"
import {Video} from "../models/video.model.js"
import {User} from "../models/user.model.js"
import mongoose from "mongoose"

const publishVideo = asyncHandler (async (req, res) => {
    try {
        
        // console.log(req.user)
        // console.log(req.files)
        // console.log(req.body)
        const {title, description} = req.body

        if ((!title) || (!description)) {
            throw new ApiError (401, "title and description required")
        }

        if (!(req.files && Array.isArray(req.files.videoFile) && req.files.videoFile.length>0)) {
            throw new ApiError (401, "video file is required")
        }
        if (!(req.files && Array.isArray(req.files.thumbnail) && req.files.thumbnail.length>0)) {
            throw new ApiError (401, "thumbnail is required")
        }
        
        const videoLocalPath =  req.files?.videoFile[0].path
        const thumbnailLocalPath = req.files?.thumbnail[0].path

        const videoResponse = await uploadOnCloudinary(videoLocalPath)
        const thumbnailResponse = await uploadOnCloudinary(thumbnailLocalPath)

        // console.log(videoResponse.duration)
        if ((!videoResponse) || (!thumbnailResponse)) {
            throw new ApiError (500, "error while uploading on cloudinary")
        }

        const video = await Video.create({
            videoFile : videoResponse.url,
            thumbnail : thumbnailResponse.url,
            title : title,
            description : description,
            duration : videoResponse.duration,
            isPublished : true,
            owner : req.user?._id
        })

        // console.log(video)

        return res.status(201)
        .json(new ApiResponse(
            201,
            {video},
            "Video uploaded successfully"
        ))


    } catch (error) {
        throw new ApiError (401, `something went wrong while uploading video: ${error}`)
    }
})

const getAllVideos = asyncHandler ( async (req, res) => {
    try {
        
        // console.log(req.query)
        let {page = 1, limit = 5, query = "", sortBy = "createdAt", sortType = "desc", username} = req.query

        const pageCount = parseInt(page)
        const limitValue = parseInt(limit)
        const skipCount = (page-1)*limit
        query = query?.trim()
        sortBy = sortBy?.trim()
        sortType = sortType?.trim()
        // console.log(username)
        username = username?.trim()
        // console.log(username)
        
        const matchStage = {
            isPublished : true,
        }
        if (username) {
            const user = await User.findOne({username})
            if (user) {
                // console.log(user._id)
                matchStage.owner = user._id
            }
            if (!user) {
                matchStage.owner = ""
            }
        }
        if (query) {
            matchStage.$or = [
                {title : {$regex : query, $options : "i"}}, //options = i, case insensitive
                {description : {$regex : query, $options : "i"}}
            ]
        }

        // console.log(matchStage)

        const sortOrder = (sortType.toLowerCase()==="asc") ? 1 : -1
        const sortStage = {
            [sortBy] : sortOrder
        }
        // console.log(sortStage)

        const videos = await Video.aggregate([
            {
                $match : matchStage
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
                    videoFile : 1,
                    thumbnail : 1,
                    title : 1,
                    duration : 1,
                    views : 1,
                    owner : "$ownerDetails.username",
                    avatar : "$ownerDetails.avatar",
                    createdAt : 1
                }
            },
            {
                $sort : sortStage
            },
            {
                $skip : skipCount
            },
            {
                $limit : limitValue
            }
        ])

        return res.status(201).json(
            new ApiResponse(
                201,
                {videos},
                "fetched all video details"
            )
        )

    } catch (error) {
        throw new ApiError (401, `something went wrong while getting all videos: ${error}`)
    }
})

const getVideoById = asyncHandler ( async (req, res) => {
    try {

        // console.log(req.params)
        let {videoId} = req.params
        
        if (!videoId) {
            throw new ApiError (401, "videoId required")
        }

        videoId = videoId?.trim()

        const video = await Video.aggregate([
            {
                $match : { _id : new mongoose.Types.ObjectId(videoId)}
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
                    videoFile : 1,
                    thumbnail : 1,
                    title : 1,
                    duration : 1,
                    views : 1,
                    owner : "$ownerDetails.username",
                    avatar : "$ownerDetails.avatar",
                    createdAt : 1
                }
            }
        ])

        // console.log(video)
        
        if (!video) {
            throw new ApiError (401, "video doesn't exist")
        }

        return res.status(201)
        .json(
            new ApiResponse(201,video,"video fetched")
        )

    } catch (error) {
        throw new ApiError (401, `something went wrong while getting video by id: ${error}`)
    }
})

const deleteVideo = asyncHandler ( async (req, res) => {
    try {
        const {videoId} = req.params
        
        const video = await Video.findById(videoId)
        if(!video) {
            throw new ApiError (401, "video doesn't exist")
        }

        const thumbnailURL = video.thumbnail
        const videoURL = video.videoFile

        await Video.findByIdAndDelete(videoId)
        await deleteFromCloudinary(thumbnailURL)
        await deleteFromCloudinary(videoURL)        

        return res.status(201)
        .json(new ApiResponse (201, {}, "video deleted successfully"))
    } catch (error) {
        throw new ApiError (401, `something went wrong while deleting video by id: ${error}`)
    }
})

const updateThumbnail = asyncHandler ( async (req, res) => {
    try {
        let {videoId} = req.params
        const newThumbnailLocalPath = req.file?.path
        if (!newThumbnailLocalPath) {
            throw new ApiError(401, "new thumbnail file required")
        }
        
        videoId = videoId?.trim()
        let video = await Video.findById(videoId)
        if (!video) {
            throw new ApiError(401, "video doesn't exist")
        }

        const oldThumbnailURL =  video.thumbnail
        const newThumbnailResponse = await uploadOnCloudinary(newThumbnailLocalPath)
        if (!newThumbnailResponse) {
            throw new ApiError(401, "New thumbnail response error")
        }

        video = await Video.findByIdAndUpdate(
            videoId,
            {
                $set : {thumbnail : newThumbnailResponse.url}
            },
            { new : true }
        )
        
        await deleteFromCloudinary(oldThumbnailURL)
        return res.status(201)
        .json(
            new ApiResponse(201,video,"thumbnail updated successfully")
        )
    } catch (error) {
        throw new ApiError(401, `error while updating thumbnail: ${error}`)
    }
})

export {publishVideo,
        getAllVideos,
        getVideoById,
        deleteVideo,
        updateThumbnail
}