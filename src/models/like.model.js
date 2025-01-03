import mongoose from "mongoose"

const likeSchema = new mongoose.Schema({

    comment : {
        type : mongoose.Schema.Types.ObjectId,
        ref : "Comment"
    },

    video : {
        type : mongoose.Schema.Types.ObjectId,
        ref : "Video"
    },

    likedBy : {
        type : mongoose.Schema.Types.ObjectId,
        ref : "User",
        required : true
    }

},{timestamps : true})

export const Like = mongoose.model("Like" , likeSchema)