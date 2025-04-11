
class ApiError extends Error {
    constructor(
        statusCode,
        message="Something went wrong",
        errors = [],
        // stack = ''
    ){
        super(message)
        //This line creates a new property called statusCode on the ApiError instance.
        this.statusCode = statusCode
        this.data = null // this.data is custom property that can hold extra information
        this.message = message
        this.success = false
        this.errors = errors

        // if(stack){
        //     this.stack = stack

        // }else{
        //     Error.captureStackTrace(this, this.constructor)
        // }
    }
}

export {ApiError}