export class APIError extends Error {
  constructor(statusCode, message, description = '', moreInfo = '') {
    super(message);
    this.statusCode = statusCode;
    this.description = description;
    this.moreInfo = moreInfo;
    Error.captureStackTrace(this, this.constructor);
  }
}
