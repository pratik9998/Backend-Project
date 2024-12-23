import {asyncHandler} from "../utils/asyncHandler.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {User} from "../models/user.model.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"

const generateAccessAndRefreshToken = async (userId) => {
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
    await User.findOneAndUpdate(
        req.user._id,
        {$set : {refreshToken : undefined}},
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

export {
    registerUser,
    loginUser,
    logoutUser
}