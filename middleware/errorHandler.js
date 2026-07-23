/**
 * Error Handler Middleware
 * Centralized error handling for all requests
 */

const responses = require("../utils/responses");
const constants = require("../config/constants");
const logger = require("./requestLogger");

/**
 * Handle application errors
 * @param {Error} error - Error object
 * @param {http.ServerResponse} res - Response object
 * @param {object} options - Additional options
 */
function handleError(error, res, options = {}) {
  const { path = "unknown", method = "UNKNOWN" } = options;

  // Log the error
  logger.error(`${method} ${path}`, error.message, error);

  // Determine status code
  let statusCode = constants.HTTP_STATUS.INTERNAL_SERVER_ERROR;
  let message = constants.ERRORS.INTERNAL_ERROR;

  if (error.name === "ValidationError") {
    statusCode = constants.HTTP_STATUS.BAD_REQUEST;
    message = constants.ERRORS.MISSING_FIELDS;
  } else if (error.name === "NotFoundError") {
    statusCode = constants.HTTP_STATUS.NOT_FOUND;
    message = error.message || constants.ERRORS.NOT_FOUND;
  } else if (error.name === "UnauthorizedError") {
    statusCode = constants.HTTP_STATUS.UNAUTHORIZED;
    message = constants.ERRORS.UNAUTHORIZED;
  } else if (error.statusCode) {
    statusCode = error.statusCode;
    message = error.message;
  }

  // Send error response
  responses.sendError(res, statusCode, message);
}

/**
 * Validate JSON parsing
 * @param {http.IncomingMessage} req - Request object
 * @param {Function} callback - Callback with error or body
 */
function parseJSON(req, callback) {
  let body = "";

  req.on("data", (chunk) => {
    body += chunk.toString();
    // Prevent DOS attacks
    if (body.length > 1e6) {
      req.connection.destroy();
    }
  });

  req.on("end", () => {
    if (!body) {
      return callback(null, {});
    }

    try {
      const parsed = JSON.parse(body);
      callback(null, parsed);
    } catch (err) {
      const error = new Error(constants.ERRORS.INVALID_JSON);
      error.name = "ValidationError";
      callback(error);
    }
  });

  req.on("error", (err) => {
    callback(err);
  });
}

/**
 * Safe async handler wrapper
 * @param {Function} handler - Async handler function
 * @returns {Function} Wrapped handler
 */
function asyncHandler(handler) {
  return async (req, res, ...args) => {
    try {
      await handler(req, res, ...args);
    } catch (error) {
      handleError(error, res, { method: req.method, path: req.url });
    }
  };
}

module.exports = {
  handleError,
  parseJSON,
  asyncHandler,
};
