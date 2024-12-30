import { ApiError } from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import {Video} from "../models/video.model.js"

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
        const {page = 1, limit = 5} = req.query

        const pageCount = parseInt(page)
        const limitValue = parseInt(limit)
        const skipCount = (page-1)*limit


        const videos = await Video.aggregate([
            {
                $match : {isPublished : true}
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

const getAllVideosOfaUser = asyncHandler ( async (req,res) => {

})

export {publishVideo,
        getAllVideos,
        getAllVideosOfaUser
}