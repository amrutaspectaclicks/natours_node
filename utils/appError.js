class AppError extends Error{
    constructor(message,statusCode){
        super(message);
        this.statusCode = statusCode;
        this.status = `${statusCode}`.startsWith('4') ? 'fail':'error';
        this.isOperational = true;

        Error.captureStackTrace(this,this.constructor);
    }
}
module.exports = AppError;
















/* Stack Trace: “Where did this error happen?”
err.stack : show us where the error happen 

 Error.captureStackTrace(this,this.constructor): 
 “Start stack trace AFTER this constructor.”
 So the constructor itself is removed from the trace.
 this Attach stack trace to current error object. and this.constructor Exclude this constructor function from the stack trace.
 */