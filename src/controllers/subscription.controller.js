import {asyncHandler} from "../utils/asyncHandler.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {Subscription} from "../models/subscription.model.js"
import {User} from "../models/user.model.js"
import mongoose from "mongoose"

const toggleSubscription = asyncHandler (async (req, res) => {
    try {
        let {channelId} = req.params

        channelId = channelId?.trim()

        if (!req?.user?._id) {
            throw new ApiError (401, "unauthorized request")
        }

        const channel = await User.findById(new mongoose.Types.ObjectId(channelId))
        if (!channel) {
            throw new ApiError (400, "channel doesn't exist")
        }
        
        // console.log(channelId)
        // console.log(req.user._id)
        // console.log(channel)
        const alreadySubscribed = await Subscription.findOne({
            subscriber : req.user?._id,
            channel : new mongoose.Types.ObjectId(channel?._id)
        })

        if (!alreadySubscribed){
            await Subscription.create({
                subscriber : req.user?._id,
                channel :  new mongoose.Types.ObjectId(channel?._id)
            })
        }
        else{
            await Subscription.findByIdAndDelete(alreadySubscribed?._id)
        }

        return res.status(201)
        .json(new ApiResponse (201, {}, "subscription changed successfully"))

    } catch (error) {
        throw new ApiError (400, `error while subscribing: ${error}`)
    }
})

//channels that i subscribed
const getSubscribedChannels = asyncHandler (async (req, res) => {
    try {
        let {channelId} = req.params
        channelId = channelId?.trim()

        if (!req?.user?._id) {
            throw new ApiError (401, "unauthorized request")
        }

        const userId = req.user?._id

        const subscribedChannels = await Subscription.aggregate([
            {
                $match : {subscriber : new mongoose.Types.ObjectId(userId)}
            },
            {
                $lookup : {
                    from : "users",
                    localField : "channel",
                    foreignField : "_id",
                    as : "channelDetails"
                }
            },
            {
                $lookup : {
                    from : "subscriptions",
                    localField : "channel",
                    foreignField : "channel",
                    as : "subscribers"
                }
            },
            {
                $addFields : {
                    subscriberCount: { $size: "$subscribers" }
                }
            },
            {
                $project : {
                    _id : 1,
                    channelId : "$channelDetails._id",
                    channelName : "$channelDetails.username",
                    channelAvatar : "$channelDetails.avatar",
                    subscriberCount : 1
                }
            }
        ])

        return res.status(200)
        .json(new ApiResponse (200,subscribedChannels,"fetched subscribed channels"))

    } catch (error) {
        throw new ApiError (400,   `error while getting subscribed channels: ${error}`)
    }
})

export {toggleSubscription,
        getSubscribedChannels
}