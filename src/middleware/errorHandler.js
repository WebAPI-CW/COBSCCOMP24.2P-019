export const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  
  // Create WSO2-compliant error response
  res.status(statusCode).json({
    code: statusCode.toString(),
    message: err.message || 'Internal Server Error',
    description: err.description || 'An unexpected error occurred.',
    moreInfo: err.moreInfo || ''
  });
};
