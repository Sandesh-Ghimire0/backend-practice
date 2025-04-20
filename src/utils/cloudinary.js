/* 
here we will take the file from the server and upload it to cloudinary
and remove the file from the server if the file is successfully uploaded to
cloudinary
*/


import {v2 as cloudinary} from 'cloudinary'
import fs from 'fs'

import dotenv from 'dotenv';
dotenv.config();


cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
    api_key: process.env.CLOUDINARY_API_KEY, 
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const uploadOnCloudinary = async (localFilePath) => {
    try {
        if(!localFilePath) return null

        // uplaod the file to cloudinary
        const response =await cloudinary.uploader.upload(localFilePath, {
            resource_type:'auto'
        })
        // console.log('File has been upload successfully in cloudinary url :',response.url)
        fs.unlinkSync(localFilePath) // remove the file locally, after it is stored successfully in the cloudinary
        
        return response
    } catch (error) {
        console.log(error)
        // remove the locally save temporary file as the upload operation got failed
        fs.unlinkSync(localFilePath)
        return null
    }
}

export {uploadOnCloudinary}

