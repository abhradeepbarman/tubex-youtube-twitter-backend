const express = require("express")
const cors = require("cors")
const cookieParser = require("cookie-parser")

const app = express()

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}))

app.use(express.json({limit: "20kb"}))  
app.use(express.urlencoded({extended: true, limit: "20kb"}))
app.use(express.static("public"))
app.use(cookieParser())

//routes import
const healthCheckRoutes = require("./routes/healthcheck.routes.js")
const userRoutes = require("./routes/user.routes.js")
const videoRoutes = require("./routes/video.routes.js")
const tweetRoutes = require("./routes/tweet.routes.js")
const likeRoutes = require("./routes/like.routes.js")
const subscriptionRoutes = require("./routes/subscription.routes.js")
const commentRoutes = require("./routes/comment.routes.js")
const playlistRoutes = require("./routes/playlist.routes.js")
const dashboardRoutes = require("./routes/dashboard.routes.js")

//routes declare
app.use("/api/v1/healthcheck", healthCheckRoutes)
app.use("/api/v1/users", userRoutes)
app.use("/api/v1/videos", videoRoutes)
app.use("/api/v1/tweets", tweetRoutes)
app.use("/api/v1/likes", likeRoutes)
app.use("/api/v1/subscriptions", subscriptionRoutes)
app.use("/api/v1/comments", commentRoutes)
app.use("/api/v1/playlists", playlistRoutes)
app.use("/api/v1/dashboard", dashboardRoutes)

module.exports = app