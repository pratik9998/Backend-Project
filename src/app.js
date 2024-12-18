import express, { json } from "express"
import cors from "cors"
import cookieParser from "cookie-parser"

const app = express();

//to use middleware, we use app.use() method
app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}))

app.use(express.json({limit : "16kb"}))  //frontend se jo json form ma data aayega uski max size
app.use(express.urlencoded({extended: true , limit: "16kb"}))  //url (encoded) se jo request aayegi uske liye
app.use(express.static("public")) //this stores some files in public folder at the backend server
app.use(cookieParser())

//api error handling and response karne ke liye utils folder me files banayi hai -> best practice
//to handle errors , we neeed to write a middleware for it which sends the structured format to user

export default app