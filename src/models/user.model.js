import mongoose, {Schema,model} from "mongoose";
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'

const userSchema = new Schema(
    {
        username:{
            type:String,
            required:true,
            unique:true,
            lowercase:true,
            trim:true,
            index:true 
            // useful when we know that we will use this field many times for searching (be careful while adding index)
        },
        email:{
            type:String,
            required:true,
            unique:true,
            lowercase:true,
            trim:true,
        },
        fullname:{
            type:String,
            required:true,
            trim:true,
            index:true
        },
        avatar:{
            type:String, // cloudinary Url
            required:true
        },
        coverImage:{
            type:String,
        },
        watchHistory:[
            {
                type:Schema.Types.ObjectId,
                ref:'Video'
            }
        ],
        password:{
            type:String,
            required:[true, 'Password is required']
        },
        refreshToken:{
            type:String,
        }
    }
,{timestamps:true})

/*
    - Middleware (also called "pre/post hooks") in Mongoose are functions that are executed before or after certain operations on MongoDB documents. They allow you to inject custom logic into the document lifecycle.

    - This code defines a Mongoose pre-save hook for a User schema that automatically hashes passwords before saving them to the database

    - async function: Needed because bcrypt.hash() is asynchronous
    - this: Refers to the document being saved

    - next() : Calls the next middleware in the chain.

*/

userSchema.pre('save',async function (next){
    if(this.isModified('password')) return next()

    this.password = await bcrypt.hash(this.password, 10)
    next()
 })


//  this methods(isPasswordCorrect) have access to the document 
 userSchema.methods.isPasswordCorrect = async function(password){
    return await bcrypt.compare(password, this.password) 
    //1.plain text password        2.encrypted password
 }


 userSchema.methods.generateAccessToken = function(){
    return jwt.sign(
        {
            _id:this._id,
            email:this.email,
            username:this.username,
            fullname:this.fullname
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn:process.env.ACCESS_TOKEN_EXPIRY
        }
    )
 }
 userSchema.methods.generateRefreshToken = function(){
    return jwt.sign(
        {
            _id:this._id,
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn:process.env.REFRESH_TOKEN_EXPIRY
        }
    )
 }



export const User = model('User',userSchema)