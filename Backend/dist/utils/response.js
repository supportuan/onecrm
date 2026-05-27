export const sendSuccess = (res, message, data = null, statusCode = 200) => {
    return res.status(statusCode).json({
        success: true,
        message,
        data,
    });
};
export const sendError = (res, message, errors = null, statusCode = 400) => {
    return res.status(statusCode).json({
        success: false,
        message,
        errors,
    });
};
