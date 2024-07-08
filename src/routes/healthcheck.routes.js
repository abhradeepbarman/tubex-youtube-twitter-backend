const { healthCheck } = require("../controllers/healthcheck.controller")
const router = require("express").Router()

router.get("/", healthCheck)

module.exports = router