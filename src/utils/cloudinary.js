import {v2 as cloudinary} from "cloudinary"
import fs from "fs"

cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
    api_key: process.env.CLOUDINARY_API_KEY, 
    api_secret: process.env.CLOUDINARY_API_SECRET // Click 'View API Keys' above to copy your API secret
})

const uploadOnCloudinary = async (filePath) => {
    try {
        if (!filePath ) return null

        const response = await cloudinary.uploader.upload(filePath , {
            resource_type : "auto"
        })
        console.log("file upload : success" , response.url)
        
        return response

    } catch (error) {
        fs.unlinkSync(filePath) // unlink file after failer in uploading file
        console.log("file upload : failure")
        return null
    }
}

export {uploadOnCloudinary}