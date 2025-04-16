/* 
here we will take the file from the server and upload it to cloudinary
and remove the file from the server if the file is successfully uploaded to
cloudinary
*/


import {v2 as cloudinary} from 'cloudinary'
import fs from 'fs'


cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
    api_key: process.env.CLOUDINARY_API_KEY, 
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const uploadOnCloudinary = async (localFilePath) => {
    try {
        if(!localFilePath) return Error('couldnot find localfilepath')

        // uplaod the file to cloudinary
        const response = cloudinary.uploader.upload(localFilePath, {
            resource_type:'auto'
        })
        console.log('File has been upload successfully in cloudinary url :',response.url)
        
        return response
    } catch (error) {
        // remove the locally save temporary file as the upload operation got failed
        fs.unlinkSync(localFilePath)
        return null
    }
}

export {uploadOnCloudinary}

