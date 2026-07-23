/**
 * Response Utilities
 * Standardized response formatting for all API endpoints
 */

const constants = require("../config/constants");

/**
 * Send success response
 * @param {http.ServerResponse} res - Response object
 * @param {number} statusCode - HTTP status code
 * @param {object} data - Response data
 * @param {string} message - Optional success message
 */
function sendSuccess(res, statusCode = 200, data = null, message = null) {
  const response = {
    success: true,
    status: statusCode,
  };

  if (message) response.message = message;
  if (data) response.data = data;

  res.writeHead(statusCode, { "Content-Type": "application/json" });
  res.end(JSON.stringify(response));
}

/**
 * Send error response
 * @param {http.ServerResponse} res - Response object
 * @param {number} statusCode - HTTP status code
 * @param {string} message - Error message
 * @param {string|array} details - Optional error details
 */
function sendError(res, statusCode = 500, message = constants.ERRORS.INTERNAL_ERROR, details = null) {
  const response = {
    success: false,
    status: statusCode,
    error: message,
  };

  if (details) response.details = details;

  res.writeHead(statusCode, { "Content-Type": "application/json" });
  res.end(JSON.stringify(response));
}

/**
 * Send validation error
 * @param {http.ServerResponse} res - Response object
 * @param {array|object} errors - Validation errors
 */
function sendValidationError(res, errors) {
  const response = {
    success: false,
    status: 400,
    error: "Validation failed",
    validationErrors: Array.isArray(errors) ? errors : [errors],
  };

  res.writeHead(400, { "Content-Type": "application/json" });
  res.end(JSON.stringify(response));
}

/**
 * Send paginated response
 * @param {http.ServerResponse} res - Response object
 * @param {array} data - Data array
 * @param {number} page - Current page
 * @param {number} limit - Items per page
 * @param {number} total - Total items
 */
function sendPaginated(res, data, page = 1, limit = 10, total = data.length) {
  const response = {
    success: true,
    status: 200,
    data,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  };

  res.writeHead(200, { "Content-Type": "application/json" });
  res.end(JSON.stringify(response));
}

/**
 * Send file download
 * @param {http.ServerResponse} res - Response object
 * @param {Buffer} content - File content
 * @param {string} filename - Filename
 * @param {string} contentType - MIME type
 */
function sendFile(res, content, filename, contentType = "text/plain") {
  res.writeHead(200, {
    "Content-Type": contentType,
    "Content-Disposition": `attachment; filename="${filename}"`,
    "Content-Length": Buffer.byteLength(content),
  });
  res.end(content);
}

module.exports = {
  sendSuccess,
  sendError,
  sendValidationError,
  sendPaginated,
  sendFile,
};
