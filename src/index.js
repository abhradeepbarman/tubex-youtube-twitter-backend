const express = require("express")
const connectDB = require("./db/index.js")
const app = require("./app.js")
require("dotenv").config()

connectDB()
.then(() => {
    app.on("error", (err) => {
        console.log("ERROR: ", err);
        throw err;
    })
    app.listen(process.env.PORT || 4000, () => {
        console.log(`Server is running at port: ${process.env.PORT}`);
    })
})
.catch((err) => {
    console.log("MONGODB connection failed: ", err);
})