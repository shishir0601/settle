/**
 * Request Logger Middleware
 * Logs all HTTP requests for debugging and monitoring
 */

const constants = require("../config/constants");

/**
 * Format timestamp
 * @returns {string} ISO timestamp
 */
function getTimestamp() {
  return new Date().toISOString();
}

/**
 * Get log level color (for terminal output)
 * @param {string} level - Log level
 * @returns {string} Color code or empty string
 */
function getLogColor(level) {
  const colors = {
    DEBUG: "\x1b[36m", // Cyan
    INFO: "\x1b[32m", // Green
    WARN: "\x1b[33m", // Yellow
    ERROR: "\x1b[31m", // Red
  };
  return colors[level] || "";
}

const reset = "\x1b[0m";

/**
 * Log message with level
 * @param {string} level - Log level (DEBUG, INFO, WARN, ERROR)
 * @param {string} message - Log message
 * @param {any} data - Optional data
 */
function log(level, message, data = null) {
  const timestamp = getTimestamp();
  const color = getLogColor(level);

  const isDevelopment = constants.NODE_ENV === "development";

  if (isDevelopment) {
    console.log(`${color}[${timestamp}] ${level}: ${message}${reset}`, data || "");
  } else {
    // Production: simpler output
    console.log(`[${timestamp}] ${level}: ${message}`, data || "");
  }
}

/**
 * Log HTTP request
 * @param {string} method - HTTP method
 * @param {string} path - Request path
 * @param {number} statusCode - Response status code
 * @param {number} duration - Request duration in ms
 * @param {any} meta - Optional metadata
 */
function logRequest(method, path, statusCode, duration, meta = null) {
  const timestamp = getTimestamp();
  let level = "INFO";

  // Determine log level based on status code
  if (statusCode >= 500) level = "ERROR";
  else if (statusCode >= 400) level = "WARN";
  else if (statusCode >= 200) level = "INFO";

  const color = getLogColor(level);
  const isDevelopment = constants.NODE_ENV === "development";

  const message = `${method} ${path} → ${statusCode} (${duration}ms)`;

  if (isDevelopment) {
    console.log(`${color}[${timestamp}] ${level}: ${message}${reset}`);
    if (meta) console.log(`  ${JSON.stringify(meta)}`);
  } else {
    console.log(`[${timestamp}] ${level}: ${message}`, meta || "");
  }
}

/**
 * Log debug message
 * @param {string} message - Message
 * @param {any} data - Optional data
 */
function debug(message, data = null) {
  if (constants.NODE_ENV === "development") {
    log("DEBUG", message, data);
  }
}

/**
 * Log info message
 * @param {string} message - Message
 * @param {any} data - Optional data
 */
function info(message, data = null) {
  log("INFO", message, data);
}

/**
 * Log warning message
 * @param {string} message - Message
 * @param {any} data - Optional data
 */
function warn(message, data = null) {
  log("WARN", message, data);
}

/**
 * Log error message
 * @param {string} message - Message
 * @param {any} error - Error object or details
 * @param {Error} errorObj - Optional Error object for stack trace
 */
function error(message, errorDetail = null, errorObj = null) {
  log("ERROR", message, errorDetail);

  if (errorObj instanceof Error && constants.NODE_ENV === "development") {
    console.error(errorObj.stack);
  }
}

module.exports = {
  log,
  logRequest,
  debug,
  info,
  warn,
  error,
};
