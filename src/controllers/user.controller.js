import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import {User} from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from 'jsonwebtoken'
import { json } from "stream/consumers";


const generateAccessAndRefreshTokens = async (userId) =>{
    try {
        // here 'user' have access to the method that we have created for the UserSchema in user.model.js
       const user =  await User.findById(userId)
       const accessToken = user.generateAccessToken()
       const refreshToken = user.generateRefreshToken()
       

       // saving the refresh Token in the database
       user.refreshToken = refreshToken
       await user.save({validateBeforeSave: false})

       return {accessToken, refreshToken}


    } catch (error) {
        console.log(error)
        throw new ApiError(500, "Failed to generate refresh and access tokens :: error :: ",error.message)
    }
}

// use asyncHandler when we are handling web request only don't use it for the methods which we need internally for the server for e.g. don't use for generateAccessAndRefreshTokens() method
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
   
   if([fullname, email, username, password].some(field => field?.trim() === "")){
       throw new ApiError(400, "All fields are required")
    }
    
    const existedUser = await User.findOne({
        $or:[{username},{email}]
    })
    if(existedUser){
        throw new ApiError(409, "User with email or username already exist")
    }
    
    // const avatarLocalPath = req.files?.avatar[0]?.path
    // const coverImageLocalPath =  req.files?.coverImage[0]?.path
    
    // above code throws an error: cannot read the propeties of undefined reading 0 so doing in this way
    let avatarLocalPath;
    if(req.files && Array.isArray(req.files.avatar) && req.files.avatar.length > 0){
        avatarLocalPath = req.files.avatar[0].path
    }
    let coverImageLocalPath;
    if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0){
        coverImageLocalPath = req.files.coverImage[0].path
    }

    if(!avatarLocalPath){
        throw new ApiError(400, "avatar file is required")
    }


    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if(!avatar){
        throw new ApiError(400, "Avatar file is required")
    }

    const user = await User.create({
        fullname:fullname,
        avatar:avatar.url,
        coverImage: coverImage?.url || "", // coverImage is not required show we need optional chaining to get url if their is coverImage
        email,
        password,
        username:username.toLowerCase()
    })

    // we have to return the API response without password and refreshToken
    const createdUser =await User.findById(user._id).select(
        "-password -refreshToken"
    )

    console.log(createdUser)

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


const loginUser = asyncHandler( async (req, res) => {
    // req body -> user
    // username and email
    // find user
    // check password
    // access and refresh token
    // send cookie

    const {username, email, password} = req.body

    if(!(username || email)){
        throw new ApiError(400, "username or email is required")
    }

    const user = await User.findOne({
        $or:[{username},{email}]
    })

    if(!user){
        throw new ApiError(404, "user does not exist")
    }

    const isPasswordValid =  await user.isPasswordCorrect(password)

    if(!isPasswordValid){
        throw new ApiError(401, "Invalid user password")
    }

    const {accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id)

    // removing the unnecessary fields from the user    
    const loggedInUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    // designing cookies
    const options = {
        httpOnly: true,
        secure: true, // this two properties disables the cookie to be modified from the frontend 
        // the server can only modify cookie
    }

    return res
    .status(200)
    .cookie("accessToken",accessToken,options) // we can access cookie because of middleware we defined in app.js
    .cookie("refreshToken",refreshToken,options)
    .json(
        new ApiResponse(
            200,
            {
                user:loggedInUser, accessToken, refreshToken
                // passing token is optional we are doing this in case user themself want to save tokens in the localStorage or something else
            },
            "User logged in successfully"
        )
    )


})


const logoutUser = asyncHandler( async (req, res)=>{
    // here we needed the access to the logged in user data for that we created the middleware
    // we could have wrote all the code of auth.middleware here but there might be the case where we need to authenticate the user in multiple places using accessToken so we created the middleware to verify the token and get the user after verification

    console.log(req.user?._id)
    await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                refreshToken:undefined
            }
        },
        {
            new: true
        }
    )

    const options = {
        httpOnly: true,
        secure: true
    }

    // clearing the cookie after logout
    return res
    .status(200)
    .clearCookie('accessToken',options)
    .clearCookie('refreshToken', options)
    .json(
        new ApiResponse(200, {}, "User logged out!!!!!!")
    )
})


const refreshAccessToken = asyncHandler( async (req, res)=>{

    /*
        - Extracts the Refresh Token
        - Validates the Refresh Token
        - Checks if the Token Belongs to a Real User
            Ensures the user exists in the database.

        - Checks Token Match
            Compares the incoming token with the one stored in the user’s record to detect token reuse.
            
        - Generates Fresh Tokens
        -Sends Them Back as Secure Cookies + JSON
        
    */
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

    if(!incomingRefreshToken){
        throw new ApiError(401, "Unauthorized Access")
    }

    
    const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET)

    const user = await User.findById(decodedToken?._id)

    if(!user){
        throw new ApiError(401,"Invalid Refresh Token")
    }


    if(incomingRefreshToken !== user?.refreshToken){
        throw new ApiError(401, "Refresh Token is expired or used")

    }

    const {accessToken, newRefreshToken} =  await generateAccessAndRefreshTokens(user._id)

    const options = {
        httpOnly:true,
        secure:true
    }


    return res
    .status(200)
    .cookie('accessToken',accessToken)
    .cookie('refreshToken',newRefreshToken)
    .json(
        new ApiResponse(
            200,
            {accessToken, refreshToken: newRefreshToken},
            "Access Token Refreshed Successfully !!!!"
        )
    )

})


const changeCurrentPassword = asyncHandler( async (req, res)=>{
    const {oldPassword, newPassword} = req.body

    const user = await User.findById(req.user?._id)

    const isPasswordValid = await user.isPasswordCorrect(oldPassword)

    if(!isPasswordValid){
        throw new ApiError(400, "Invalid Old password")
    }

    user.password = newPassword
    await user.save({validateBeforeSave:true}) // pre  hook defined in user.model.js will execute  before saving 


    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            {},
            "Password changed Successfully !!!!"
        )
    )

})


const getCurrentUser = asyncHandler( async (req, res)=>{
    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            req.user,
            "Current user fetched successfully !!!"
        )
    )
})


const updateAccountDetails = asyncHandler( async (req, res)=>{

    /*
        - get the fullname and email from the req.body
        - find the current user using the middleware
        - change the required field of the user
        - return response
    */
    const {fullname, email} = req.body

    if(!fullname || !email){
        throw new ApiError(400, "Empty field not allowed while updating")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                fullname,
                email
            }
        },
        {
            new:true // this returns the updated user as well so that we can store in a variable
        }
    ).select("-password")


    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            user,
            "Account details updated successfully !!!"
        )
    )
})


const updateUserAvatar = asyncHandler( async (req, res)=>{
    /*
        - get the avatarLocalPath using the middleware
        - upload the avatar on cloudinary
        - find current user
        - update the url using object returned by cloudinary
        - return res
     */
    const avatarLocalPath = req.file?.path // we only have one field in the middleware (check route)

    if(!avatarLocalPath){
        throw new ApiError(400, "avatar file is missing")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)

    if(!avatar.url){
        throw new ApiError(400, "Error while uploading a new avatar")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                avatar:avatar.url
            }
        },
        {new:true}
    ).select("-password")

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            user,
            "Avatar updated successfully !!!"
        )
    )
})



const updateUserCoverImage = asyncHandler( async (req, res)=>{

    const coverImageLocalPath = req.file?.path // we only have one field in the middleware (check route)

    if(!coverImageLocalPath){
        throw new ApiError(400, "coverImage file is missing")
    }

    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if(!coverImage.url){
        throw new ApiError(400, "Error while uploading a new coverImage")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                coverImage:coverImage.url
            }
        },
        {new:true}
    ).select("-password")

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            user,
            "coverImage updated successfully !!!"
        )
    )
})
export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetails,
    updateUserAvatar,
    updateUserCoverImage
}