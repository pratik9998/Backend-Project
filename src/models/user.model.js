import mongoose from "mongoose"
import jwt from "jsonwebtoken"
import bcrypt from "bcrypt"


const userSchema = new mongoose.Schema({

    username : {
        type : String,
        required : true,
        unique: true,
        lowercase : true,
        trim : true,
        maxlength : 50,
        index : true
    },

    email : {
        type : String,
        required : true,
        unique: true,
        lowercase : true,
        trim : true,
    },

    fullName : {
        type : String,
        required : true,
        trim : true,
        maxlength : 100,
    },

    avatar : {
        type : String, // cloudinary url
        required : true,
    },

    coverImage : {
        type : String, // cloudinary url
    },

    watchHistory : [
        {
            type : mongoose.Schema.Types.ObjectId,
            ref: "Video"
        }
    ],

    password : {
        type : String,
        required : [true , "Password required!!"],
        minlength : [2 , "minimum length of password is 2!!"],
        maxlength : [50 , "Maxlength for password is 50"]
    },

    refreshToken : {
        type : String
    }

},{timestamps : true})

//runs just before saving to database only when password is changed, like middleware
userSchema.pre("save" , async function (next) {
    if (!this.isModified("password")) return next()
    this.password = await bcrypt.hash(this.password , 10) // 10 rounds
    next()
})

//now we add a custom method to check whether password is correct
userSchema.methods.isPasswordCorrect = async function (password) {
    return await bcrypt.compare(password , this.password)
}

//new custom method to generate access token
userSchema.methods.generateAccessToken = function () {
    return jwt.sign(
        {
            _id : this._id,
            email : this.email,
            username : this.username,
            fullName : this.fullName
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn : process.env.ACCESS_TOKEN_EXPIRY
        }
    )
}
userSchema.methods.generateRefreshToken = function () {
    return jwt.sign(
        {
            _id : this._id,
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn : process.env.REFRESH_TOKEN_EXPIRY
        }
    )
}

export const User = mongoose.model("User" , userSchema)