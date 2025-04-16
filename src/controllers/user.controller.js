import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import {User} from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";


const registerUser = asyncHandler( async (req, res) => {
    /*
    steps:-
    
    - get user details from frontend
    - validation : not empty
    - check if user already exist : username, email
    - check for images, avatar 
    - upload them to cloudinary
    - create user oject , create entry in db
    - remove password and refresh token from db response
    - check for user creation
    - return response
    */

    const { username, email, fullname, password } = req.body
    console.log('email : ',email)

    if([fullname, email, username, password].some(field => field?.trim() === "")){
        throw new ApiError(400, "All fields are required")
    }

    const exitedUser = User.findOne({
        $or:[{username},{email}]
    })
    if(exitedUser){
        throw new ApiError(409, "User with email or username already exist")
    }

    const avatarLocalPath = req.files?.avatar[0]?.path
    const coverImageLocalPath =  req.files?.coverImage?.path

    if(!avatarLocalPath){
        throw new ApiError(400, "avatar file is required")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(avatarLocalPath)

    if(!avatar){
        throw new ApiError(400, "Avatar file is required")
    }

    const user =  User.create({
        fullname:fullname,
        avatar:avatar.url,
        coverImage: coverImage?.url || "",
        email,
        password,
        username:username.toLowerCase()
    })

    const createdUser = user.findById(user._id).select(
        "-password refreshToken"
    )

    if(!createdUser){
        throw new ApiError(500, "something went wrong while registering the user")
    }

    return res.status(201).json(
        new ApiResponse(
            200,
            createdUser,
            "User Registered Successfully",
        )
    )



})


export {registerUser}