import mongoose from "mongoose";
import connectDB from "./db/index.js";

import dotenv from 'dotenv'
dotenv.config()

connectDB()




/*
import { DB_NAME } from "./constants";

import express from "express";

const app = express()

( async ()=>{
    try {
        await mongoose.connect(`${process.env.mMONGODB_URI}/${DB_NAME}`)
        app.on('error',(error)=>{
            console.log('Error: ',error)
            throw error 
        })

        app.listen(`App is listening on port ${process.env.PORT}`)
    } catch (error) {
        console.error('Error: ',error)
        throw error
    }
} )()
*/