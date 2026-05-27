export const sendSuccess = (res, message, data = {}) => {
  res.status(200).json({ success: true, message, data });
};
export const sendError = (res, message, errors = [], status = 500) => {
  res.status(status).json({ success: false, message, errors });
};
