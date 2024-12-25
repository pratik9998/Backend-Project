import { ApiError } from "../utils/ApiError.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import jwt from "jsonwebtoken"
import {User} from "../models/user.model.js"

const verifyJWT = asyncHandler (async (req, res, next) => {
    try {
        const incomingToken = req.cookie?.accessToken || 
                        req.header("Authorization")?.replace("Bearer ", "")
        
        if (!incomingToken) {
            throw new ApiError (401 , "Unauthorized request")
        }
    
        const decodedToken = jwt.verify(incomingToken, process.env.ACCESS_TOKEN_SECRET)
    
        const user = await User.findById(decodedToken?._id).select(
            "-password -refreshToken"
        )
    
        if (!user) {
            throw new ApiError (401 , "Invalid Access Token")
        }
    
        req.user = user
        next()
        
    } catch (error) {
        throw new ApiError (401 , error?.message || "Invalid Access Token")
    }
})

export {verifyJWT}