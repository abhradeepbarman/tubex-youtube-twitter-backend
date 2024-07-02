const mongoose = require("mongoose")
const {DB_NAME} = require("../constants.js")
require("dotenv").config()

const connectDB = async () => {
    try {
        const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
        console.log(`MONGODB connected !! DB host: ${connectionInstance.connection.host}`);
    } catch (error) {
        console.log("MONGODB connection failed: ", error);
        process.exit(1)
    }
}

module.exports = connectDB 