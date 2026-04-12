class ApiResponse {
    constructor(status, message = "success", data = null) {
        this.statusCode = status;
        this.message = message;
        this.data = data;
        this.success = status < 400;
    }
}

export { ApiResponse };
