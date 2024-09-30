const errorMiddleware = (err , req,res , next)=>{
    err.message = err.message || "Internal Server Error"
    err.statusCode ||= 400

    return res.status(err.statusCode).json({
        success : false , 
        message : err.message
    })
}


module.exports = {errorMiddleware}