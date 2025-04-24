exports.Response = (res, statusCode, message, data) => {
    return res.status(statusCode).json({
        message, data
    });
}
