export const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';
  let description = err.description || 'An unexpected error occurred.';

  // Handle Mongoose CastError (invalid ObjectId in URL param)
  if (err.name === 'CastError' && err.kind === 'ObjectId') {
    statusCode = 400;
    message = 'Bad Request';
    description = `Invalid ID format: '${err.value}' is not a valid resource ID.`;
  }

  // Handle Mongoose duplicate key error
  if (err.code === 11000) {
    statusCode = 400;
    message = 'Bad Request';
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    description = `Duplicate value: a record with this ${field} already exists.`;
  }

  res.status(statusCode).json({
    code: statusCode.toString(),
    message,
    description,
    moreInfo: err.moreInfo || ''
  });
};
