/**
 * Application Configuration & Constants
 * Centralized settings for the entire application
 */

const path = require("path");

module.exports = {
  // Server Configuration
  PORT: process.env.PORT || 3000,
  NODE_ENV: process.env.NODE_ENV || "development",
  PUBLIC_DIR: path.join(__dirname, "../public"),

  // Database Configuration
  DB_PATH: process.env.SETTLE_DB || path.join(__dirname, "../data.json"),
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB

  // API Configuration
  API_VERSION: "v1",
  REQUEST_TIMEOUT: 30000, // 30 seconds
  MAX_PAYLOAD_SIZE: "10mb",

  // Validation Constraints
  VALIDATION: {
    GROUP_NAME_MIN: 1,
    GROUP_NAME_MAX: 100,
    MEMBER_NAME_MIN: 1,
    MEMBER_NAME_MAX: 50,
    MEMBERS_MIN: 2,
    MEMBERS_MAX: 100,
    EXPENSE_DESC_MIN: 1,
    EXPENSE_DESC_MAX: 200,
    EXPENSE_AMOUNT_MIN: 0.01,
    EXPENSE_AMOUNT_MAX: 10000000,
    EXPENSE_SPLIT_MAX: 100,
  },

  // Expense Categories
  EXPENSE_CATEGORIES: [
    "food",
    "transport",
    "accommodation",
    "entertainment",
    "shopping",
    "utilities",
    "other",
  ],

  // HTTP Status Codes
  HTTP_STATUS: {
    OK: 200,
    CREATED: 201,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    CONFLICT: 409,
    INTERNAL_SERVER_ERROR: 500,
    SERVICE_UNAVAILABLE: 503,
  },

  // MIME Types
  MIME_TYPES: {
    ".html": "text/html",
    ".css": "text/css",
    ".js": "application/javascript",
    ".json": "application/json",
    ".svg": "image/svg+xml",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".csv": "text/csv",
    ".pdf": "application/pdf",
  },

  // Error Messages
  ERRORS: {
    INVALID_JSON: "Invalid JSON in request body",
    MISSING_FIELDS: "Missing required fields",
    INVALID_GROUP: "Invalid group data",
    GROUP_NOT_FOUND: "Group not found",
    MEMBER_NOT_FOUND: "Member not found",
    EXPENSE_NOT_FOUND: "Expense not found",
    DUPLICATE_MEMBER: "Member already exists",
    INVALID_AMOUNT: "Invalid amount",
    INVALID_SPLIT: "Invalid split configuration",
    INVALID_CATEGORY: "Invalid expense category",
    INTERNAL_ERROR: "Internal server error",
    NOT_FOUND: "Resource not found",
    UNAUTHORIZED: "Unauthorized access",
  },

  // Success Messages
  SUCCESS: {
    GROUP_CREATED: "Group created successfully",
    MEMBER_ADDED: "Member added successfully",
    EXPENSE_ADDED: "Expense added successfully",
    EXPENSE_UPDATED: "Expense updated successfully",
    EXPENSE_DELETED: "Expense deleted successfully",
    GROUP_UPDATED: "Group updated successfully",
    GROUP_DELETED: "Group deleted successfully",
  },

  // Logging Configuration
  LOG_LEVELS: {
    DEBUG: "DEBUG",
    INFO: "INFO",
    WARN: "WARN",
    ERROR: "ERROR",
  },

  // Decimal Precision
  DECIMAL_PLACES: 2,
};
