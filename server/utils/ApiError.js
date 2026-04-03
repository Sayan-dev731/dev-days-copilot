class ApiError extends Error {
    constructor(status, message = "failure", error = [], stack = "") {
        super(message);
        this.status = status;
        this.error = error;
        this.message = message;
        this.success = false;

        if(stack) {
            this.stack = stack;
        }

        else {
            Error.captureStackTrace(this, this.constructor);
        }
    }
}

export {ApiError};