import {asyncHandler} from "../utils/asyncHandler.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {User} from "../models/user.model.js"
import {uploadOnCloudinary, deleteFromCloudinary} from "../utils/cloudinary.js"
import jwt from "jsonwebtoken"
import mongoose from "mongoose"

const generateAccessAndRefreshToken = async (userId) => {
    //ye tab kaam aayega jab user login karega
    try {
        const user = await User.findById(userId)
        // console.log(process.env.ACCESS_TOKEN_SECRET)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken
        await user.save({validateBeforeSave : false})

        return {accessToken, refreshToken}
        
    } catch (error) {
        throw new ApiError (500, `Something went wrong while generating refresh and access token: "${error}`)
    }
}

const registerUser = asyncHandler ( async (req , res) => {
    // get user details from frontend
    // validation - not empty
    // check if user already exists: username, email
    // check for images, check for avatar
    // upload them to cloudinary, avatar
    // create user object - create entry in db
    // remove password and refresh token field from response
    // check for user creation
    // return res

    const {fullName , username , email , password} = req.body
    // console.log(fullName , username , email , password)
    
    //here we used some() method of array
    if ( [fullName, username , email , password].some((field)=>field?.trim()==="") ) {
        throw new ApiError(400 , "All fields are required")
    }
    
    const existedUser =await User.findOne({
        $or : [{ username } , { email }] 
        //$or is a mongodb query operator, checks for any of these is true or not
    })

    if (existedUser){
        throw new ApiError(409 , "User Already Exists!!")
    }
    
    //hmne jo multer middleware use kiya hai, vo hme req me ek aur option add kara deta hai files ka jo ki hum avatar aur coverimage ko validate karne ke liye use karege
    // console.log(req.files)
    const avatarLocalPath = req.files?.avatar[0]?.path
    // const coverImageLocalPath = req.files?.coverImage[0]?.path

    let coverImageLocalPath
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length>0){
        coverImageLocalPath = req.files.coverImage[0].path
    }
    
    // console.log(req.files)
    if ( !avatarLocalPath ){
        throw new ApiError(400 , "Avatar is required")
    }
    
    // console.log(avatarLocalPath)
    const avatarResponse = await uploadOnCloudinary(avatarLocalPath)
    const coverImageResponse = await uploadOnCloudinary(coverImageLocalPath)

    if (!avatarResponse){
        throw new ApiError(400 , "Avatar file on clodinary required")
    }

    const user =await User.create({
        fullName,
        avatar : avatarResponse.url,
        coverImage : coverImageResponse?.url || "",
        username : username.toLowerCase(),
        password,
        email
    })

    // console.log(user)
    
    const createdUser =await User.findById(user._id).select(
        "-password -refreshToken"
    )

    // console.log(createdUser)
    
    if (!createdUser){
        throw new ApiError(500 , "something went wrong while registering user")
    }

    return res.status(201).json(
        new ApiResponse(200 , createdUser , "user created successfully")
    )
})

const loginUser = asyncHandler ( async (req , res) => {
    //req body se data
    //username or email validation
    //user find
    //check password
    //generate accesstoken and refreshtoken
    //send cookies
    // console.log(req.body)
    const {username, email, password} = req.body

    if (!(username || email)) {
        throw new ApiError (400, "username or email is required")
    }

    if (!password) {
        throw new ApiError (400, "password is required")
    }

    const user = await User.findOne({
        $or : [{username}, {email}]
    })
    
    if (!user) {
        throw new ApiError (404 , "User doesn't exist")
    }

    const isValid = await user.isPasswordCorrect(password)

    if (!isValid) {
        throw new ApiError (401 , "Incorrect Password")
    }

    const {accessToken, refreshToken} = await generateAccessAndRefreshToken(user._id)

    const loggedInUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    const options = {
        httpOnly : true,
        secure : true
    }

    return res.status(200)
    .cookie("accessToken" , accessToken , options)
    .cookie("refreshToken" , refreshToken , options)
    .json(
        new ApiResponse (
            200,
            {user: loggedInUser, accessToken, refreshToken},
            "User logged In successfully"
        )
    )
})

const logoutUser = asyncHandler (async (req , res) => {
    //here we need a user, which should be logged in,
    //for that i created auth middleware which accepts the accesstoken from req
    //and decodes it and finds user by its id and attachess this user with req, which can be access by req.user -> this is done by auth middleware

    //for logout, you need to remove refresh token
    await User.findByIdAndUpdate(
        req.user._id,
        {$unset : {refreshToken : 1}},
        {new : true} //isse updated user milega
    )

    const options = {
        httpOnly : true,
        secure : true
    }

    return res.status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse (200, {}, "User logged Out"))
})

const refreshAccessToken = asyncHandler (async (req, res) => {
    //accesstoken ko refresh karne ke liye
    try {
        
        const incomingRefreshToken = req.cookies?.refreshToken || req.body.refreshToken
        if (!incomingRefreshToken) {
            throw new ApiError (401, "Unauthorized request")
        }

        const decodedToken = Jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET)

        const user = await User.findById(decodedToken?._id)
        if (!user) {
            throw new ApiError (401, "Invalid Refresh Token")
        }
        
        if (incomingRefreshToken !== user?.refreshToken) {
            throw new ApiError(401, "Refresh Token expired")
        }

        const options = {
            httpOnly : true,
            secure : true
        }

        const {newAccessToken, newRefreshToken} = await generateAccessAndRefreshToken(user._id)

        return res.status(20)
        .cookie("accessToken", newAccessToken, options)
        .cookie("refreshToken", newRefreshToken, options)
        .json(
            new ApiResponse(
                200,
                {
                    newAccessToken, 
                    refreshToken : newRefreshToken
                },
                "Access token refreshed"
            )
        )

    } catch (error) {
        throw new ApiError (401, `Error when refreshing access token: ${error}`)
    }
})

const changeUserPassword = asyncHandler ( async (req, res) => {
    //isse pehle auth middleware lagaya hai, jo ki req me user add karke hi send kar rha
    try {
        const {oldPassword, newPassword} = req.body
        
        const user = await User.findById(req.user?._id)
        const isOldPasswordCorrect = user.isPasswordCorrect(oldPassword)

        if (!isOldPasswordCorrect) {
            throw new ApiError (400, "Invalid Old password")
        }

        user.password = newPassword
        await user.save({validateBeforeSave : false})

        return res.status(200).json(new ApiResponse (200, {}, "Password changed"))

    } catch (error) {
        throw new ApiError (401, `Something went wrong while changing the password: ${error}`)
    }
})

const getCurrentUser = asyncHandler (async (req, res) => {
    return res.status(200).json(new ApiResponse (200, req.user, "user fetched successfully"))
})

const updateUserAvatar = asyncHandler ( async (req, res) => {
    try {
        console.log(req.file)
        const newAvatarLocalPath = req.file?.path
        if (!newAvatarLocalPath) {
            throw new ApiError (400, "New Avatar File is not Locally Available on Server")
        }
    
        const newAvatarResponse = await uploadOnCloudinary(newAvatarLocalPath)
        if (!newAvatarResponse) {
            throw new ApiError (400, "error while uploading new Avatar file on cloudinary")
        }
        
        const oldAvatar = req.user?.avatar
        //kyuki hme updated user send karna padega na
        const user = await User.findByIdAndUpdate(
            req.user?._id,
            {
                $set : {
                    avatar : newAvatarResponse.url
                }
            },
            {new : true}
        ).select("-password")
        
        // console.log(user)
        await deleteFromCloudinary(oldAvatar)
    
        return res.status(200).json(new ApiResponse(200, user, "Avatar changed successfully"))

    } catch (error) {
        throw new ApiError (500, `something went wrong while changing avatar: ${error}`)
    }
})

const updateCoverImage = asyncHandler ( async (req, res) => {
    try {

        const newCoverImageLocalPath = req.file?.path
        if (!newCoverImageLocalPath) {
            throw new ApiError (400, "New cover image File is not Locally Available on Server")
        }
    
        const newCoverImageResponse = await uploadOnCloudinary(newCoverImageLocalPath)
        if (!newCoverImageResponse) {
            throw new ApiError (400, "error while uploading new cover image file on cloudinary")
        }
        
        const oldCoverImage = req.user?.coverImage
        //kyuki hme updated user send karna padega na
        const user = await User.findByIdAndUpdate(
            req.user?._id,
            {
                $set : {
                    coverImage : newCoverImageResponse.url
                }
            },
            {new : true}
        ).select("-password -refreshToken")
        
        await deleteFromCloudinary(oldCoverImage)
        return res.status(200).json(new ApiResponse(200, user, "Avatar changed successfully"))

    } catch (error) {
        throw new ApiError (500, `something went wrong while changing avatar: ${error}`)
    }
})

const getUserChennelProfile = asyncHandler ( async (req, res) => {
    const {username} = req.params

    if (!username?.trim()) {
        throw new ApiError (400, "username is required")
    }

    //now it's time to write aggregation pipeline which returns an array of objects
    //these square-breckets are stages, which performs step by step process
    const channel = await User.aggregate([
        {
            $match : {username : username?.toLowerCase()}
        },
        {
            $lookup : {
                from: "subscriptions", //mongodb me jis name se save hota us name se likhna padta
                localField: "_id",
                foreignField: "channel", //field from from collection
                as: "subscribers"
            }
        },
        {
            $lookup : {
                from: "subscriptions",
                localField: "_id",
                foreignField: "subscriber",
                as: "subscribedTo"
            }
        },
        {
            $addFields : {
                subscribersCount : {$size : "$subscribers"},
                subscribedCount : {$size : "$subscribedTo"},
                isSubscribed : {
                    $cond : {
                        if : {$in : [req.user?._id, "$subscribers.subscriber"]}, //
                        then : true,
                        else : false
                    }
                }
            }
        },
        {
            $project : {
                _id : 1,
                fullName : 1,
                username : 1,
                email : 1,
                avatar : 1,
                coverImage : 1,
                subscribersCount : 1,
                subscribedCount : 1,
                isSubscribed : 1
            }
        }
    ])

    console.log(channel)
    if (!channel?.length) {
        throw new ApiError (404, "channel does not exist")
    }

    return res.status(200)
    .json(new ApiResponse (200, channel[0], "Channel details fetched successfully"))
})

const getWatchHistory = asyncHandler ( async (req, res) => {
    try {

        const user = await User.aggregate([
            {
                $match : {
                    _id : new mongoose.Types.ObjectId(req.user._id)
                }
            },
            {
                $lookup : {
                    from : "videos",
                    localField : "watchHistory",
                    foreignField : "_id",
                    as : "watchHistory",
                    pipeline : [
                        {
                            $lookup : {
                                from : "users",
                                localField : "owner",
                                foreignField : "_id",
                                as : "owner",
                                pipeline : [
                                    {
                                        $project : {
                                            fullName : 1,
                                            username : 1,
                                            avatar : 1
                                        }
                                    }
                                ]
                            }
                        },
                        {
                            $addFields : {
                                owner : {
                                    $first: "$owner"
                                }
                            }
                        }
                    ]
                }
            },

        ])

        return res.status(200)
        .json(new ApiResponse (
            200,
            user[0].watchHistory,
            "watch history fetched successfully"
        ))
        
    } catch (error) {
        throw new ApiError (500 , `something went wrong while getting watch history: ${error}`)
    }
})

export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeUserPassword,
    getCurrentUser,
    updateUserAvatar,
    updateCoverImage,
    getUserChennelProfile,
    getWatchHistory
}