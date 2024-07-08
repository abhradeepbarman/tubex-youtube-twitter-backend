exports.healthCheck = async( _ , res ) => {
    try {
        //TODO: build a healthcheck response that simply returns the OK status as json with a message
        return res.status(200).json({
            success: true,
            message: "OK"
        })
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: "Internal Server Error"
        })
    }
}