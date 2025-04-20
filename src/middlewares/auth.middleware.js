
// middleware helps to do some task before going to the server.
// it adds some properties in the request object

import { User } from "../models/user.model";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from 'jsonwebtoken'

/*
it is authenticating the access token and adding the user in the req object

there might be the case where we need to authenticate the user in multiple places using accessToken so we created the middleware to verify the token
*/
export const verifyJWT = asyncHandler(async (req, _ , next) => {
    //                   for browser                 for mobile apps or postman 
    const accessToken =  req.cookies?.accessToken || req.header('Authorization').replace('Bearer ','')

    if(!token){
        throw new ApiError(401, 'Unauthorized Access')
    }

    const decodedToken = jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET)

    const user = await User.findById(decodedToken?._id).select(
        "-password -refreshToken"
    )

    if(!user){
        // TODO: discuss about frontend
        throw new ApiError(401, "Invalid Access Token")
    }

    // adding new 'user' property in the req object
    req.user = user
    next()
})

