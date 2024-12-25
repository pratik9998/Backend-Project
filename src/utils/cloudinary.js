import {v2 as cloudinary} from "cloudinary"
import fs, { appendFile } from "fs"
import { ApiError } from "./ApiError.js"

cloudinary.config({  //why env gives error, solved in package.json, "dev" command changed
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
    api_key: process.env.CLOUDINARY_API_KEY, 
    api_secret: process.env.CLOUDINARY_API_SECRET
})

const uploadOnCloudinary = async (filePath) => {
    try {

        // console.log(process.env.CLOUDINARY_CLOUD_NAME ,process.env.CLOUDINARY_API_KEY , process.env.CLOUDINARY_API_SECRET)

        if (!filePath ) return null

        // console.log(filePath)

        const response = await cloudinary.uploader.upload(filePath , {
            resource_type : "auto"
        })
        // console.log("cloudinary file upload : success" , response.url)
        fs.unlinkSync(filePath)
        return response

    } catch (error) {
        fs.unlinkSync(filePath) // unlink file after failer in uploading file
        console.log("cloudinary file upload : failure" , error)
        return null
    }
}

const deleteFromCloudinary = async (imageURL) => {
    try {

        //first extract public id
        //example : "http://res.cloudinary.com/djft6bnxc/image/upload/v1735105158/public_id.png" ==> in this publidId is last name without extension
        const urlArray = imageURL.split('/')
        const last = urlArray[urlArray.length - 1]
        const publicId = last.split('.')[0]
    
        // console.log(publicId)
    
        await cloudinary.uploader.destroy(publicId, (error, result) => {
            if (error){
                throw new ApiError(500,`existing file could not be deleted from cloudinary: ${error}`)
            } 
        })

    } catch (error) {
        throw new ApiError (500, `error while destroying existing image on cloudinary: ${error}`)
    }
}

export {uploadOnCloudinary, deleteFromCloudinary}