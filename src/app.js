import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'


export const app = express()

app.use(cors({
    origin:process.env.CORS_ORIGIN,
    credentials:true
}))

app.use(express.json({limit:'16kb'}))
app.use(express.urlencoded({extended:true}))
app.use(express.static('public'))
app.use(cookieParser()) // it is used to read and write the cookies from the user browser


//-----------------------------------------------------------------------------------------------------------

import userRouter from './routes/user.route.js'

app.use('/api/v1/users',userRouter)
// http://localhost:8000/api/v1/users/<user.route - methods>register