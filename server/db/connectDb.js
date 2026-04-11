import mongoose from "mongoose";
import { DBName } from "../constants.js";

const connectDb = async () => {
    try {
        const connectionInstance = await mongoose.connect(
            `${process.env.MONGODB_URI}/${DBName}`,
        );
        console.log(
            "Successfully connected to the mongodb server: ",
            connectionInstance.connection.host,
        );
    } catch (error) {
        console.error("Error connecting to the mongodb server", error);
    }
};

export default connectDb;
