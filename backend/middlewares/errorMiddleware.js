exports.errorHandler = (err, req, res, next) => {
  console.error(err.stack); // Log error for debugging

  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
};
