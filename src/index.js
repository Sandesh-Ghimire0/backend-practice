import dotenv from 'dotenv'
dotenv.config()


import connectDB from "./db/index.js";
import { app } from './app.js';





connectDB()  
    .then(()=>{
        app.listen(process.env.PORT || 8000, ()=>{
            console.log(`server is running on port : ${process.env.PORT}`)
        })
    })
    .catch(error  =>{
        console.log("MONGO DB connection Failed !!!!")
    })




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