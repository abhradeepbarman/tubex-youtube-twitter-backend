const mongoose = require("mongoose")

const tweetSchema = new mongoose.Schema({
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
    content: {  
        type: String,
        required: true,
        maxLength: 255
    }
}, {timestamps: true})

const Tweet = mongoose.model("Tweet", tweetSchema)
module.exports = Tweet