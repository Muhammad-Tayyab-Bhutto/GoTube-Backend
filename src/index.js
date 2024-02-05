import dotenv from 'dotenv'
import connectDB from './db/index.js'
import {app} from './app.js'

dotenv.config(
    {
        path: './env'
    }
)

connectDB()
.then(() => {
    app.listen(process.env.PORT, () => {
        console.log(`Server running on port ${process.env.PORT}`)
    })
})
.catch(err => console.error("Database connection error!!!"+ err.message));



/*
Approch 1 using iffi 
( async () => {
    try {
        await mongoose.connect(`${process.env.MONGOD_URI}/${DBNAME}`, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            useCreateIndex: true,
            useFindAndModify: false
        })
        app.on('connection', () => {
            console.log("Connected to MongoDB!")
        })
        app.error('error', (error) => {
            console.log("Error connecting to MongoDB!", error)
            throw new Error("Error connecting to MongoDB: " + error.message)
        })
        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`)
        })
    } catch (error) {
        console.error(error);
        throw new Error("Error connecting to MongoDB: " + error.message)
    }
})() 
*/