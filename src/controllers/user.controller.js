import {asyncHandler} from "../utils/asyncHandler.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {User} from "../models/user.model.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"

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
    
    const existedUser = User.findOne({
        $or : [{ username } , { email }] 
        //$or is a mongodb query operator, checks for any of these is true or not
    })

    if (existedUser){
        throw new ApiError(409 , "User Already Exists!!")
    }
    
    //hmne jo multer middleware use kiya hai, vo hme req me ek aur option add kara deta hai files ka jo ki hum avatar aur coverimage ko validate karne ke liye use karege
    const avatarLocalPath = req.files?.avatar[0]?.path
    const coverImageLocalPath = req.files?.coverImage[0]?.path

    if ( !avatarLocalPath ){
        throw new ApiError(400 , "Avatar is required")
    }

    const avatarResponse = await uploadOnCloudinary(avatarLocalPath)
    const coverImageResponse = await uploadOnCloudinary(coverImageLocalPath)

    if (!avatarResponse){
        throw new ApiError(400 , "Avatar file is required")
    }

    const user = User.create({
        fullName,
        avatar : avatarResponse.url,
        coverImage : coverImageResponse?.url,
        username : username.toLowerCase(),
        password,
        email
    })
    
    const createdUser =await User.findById(user._id).select(
        "-password -refreshToken"
    )
    
    if (!createdUser){
        throw new ApiError(500 , "something went wrong while registering user")
    }

    return res.status(201).json(
        new ApiResponse(200 , createdUser , "user created successfully")
    )
})

export {
    registerUser
}