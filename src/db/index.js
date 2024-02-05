import mongoose from "mongoose";
import { DBNAME } from "../constants.js";

const PORT = process.env.PORT || 3000;
const connectDB = async () => {
    try {
        const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URI}/${DBNAME}`)
        
        console.log("MongoDB connected! Host: " + connectionInstance.connection.host);
    } catch (error) {
        console.error("Mongdb Connection Failed! "+error);
        process.exit(1)
    }
};

export default connectDB;