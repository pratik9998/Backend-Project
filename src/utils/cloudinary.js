import {v2 as cloudinary} from "cloudinary"
import fs from "fs"

cloudinary.config({ 
    cloud_name: "djft6bnxc", 
    api_key: "824682536959268", 
    api_secret: "t1wdLSJi7KEooj4RcubliaooVS0"
})

// cloudinary.config({  // why this gives error
//     cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
//     api_key: process.env.CLOUDINARY_API_KEY, 
//     api_secret: process.env.CLOUDINARY_API_SECRET
// })

const uploadOnCloudinary = async (filePath) => {
    try {

        // console.log(process.env.CLOUDINARY_CLOUD_NAME ,process.env.CLOUDINARY_API_KEY , process.env.CLOUDINARY_API_SECRET)

        if (!filePath ) return null

        // console.log(filePath)

        const response = await cloudinary.uploader.upload(filePath , {
            resource_type : "auto"
        })
        console.log("cloudinary file upload : success" , response.url)
        fs.unlinkSync(filePath)
        return response

    } catch (error) {
        fs.unlinkSync(filePath) // unlink file after failer in uploading file
        console.log("cloudinary file upload : failure" , error)
        return null
    }
}

export {uploadOnCloudinary}