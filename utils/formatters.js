/**
 * Formatting Utilities
 * Common formatting functions for amounts, dates, etc.
 */

const constants = require("../config/constants");

/**
 * Format amount as currency
 * @param {number} amount - Amount in rupees
 * @param {string} locale - Locale for formatting
 * @returns {string} Formatted currency string
 */
function formatCurrency(amount, locale = "en-IN") {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: constants.DECIMAL_PLACES,
    maximumFractionDigits: constants.DECIMAL_PLACES,
  }).format(amount);
}

/**
 * Format amount as number with locale
 * @param {number} amount - Amount
 * @param {string} locale - Locale for formatting
 * @returns {string} Formatted number
 */
function formatNumber(amount, locale = "en-IN") {
  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: constants.DECIMAL_PLACES,
    maximumFractionDigits: constants.DECIMAL_PLACES,
  }).format(amount);
}

/**
 * Format date
 * @param {Date|string} date - Date to format
 * @param {string} format - Format string (short, long, full)
 * @returns {string} Formatted date
 */
function formatDate(date, format = "short") {
  const d = typeof date === "string" ? new Date(date) : date;

  const options = {
    short: { year: "numeric", month: "short", day: "numeric" },
    long: { year: "numeric", month: "long", day: "numeric" },
    full: { weekday: "long", year: "numeric", month: "long", day: "numeric" },
  };

  return d.toLocaleDateString("en-IN", options[format] || options.short);
}

/**
 * Format date and time
 * @param {Date|string} date - Date to format
 * @returns {string} Formatted date and time
 */
function formatDateTime(date) {
  const d = typeof date === "string" ? new Date(date) : date;

  return d.toLocaleDateString("en-IN", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Format percentage
 * @param {number} value - Value between 0 and 1
 * @param {number} decimals - Decimal places
 * @returns {string} Formatted percentage
 */
function formatPercentage(value, decimals = 1) {
  return (value * 100).toFixed(decimals) + "%";
}

/**
 * Truncate string to max length
 * @param {string} str - String to truncate
 * @param {number} maxLength - Max length
 * @returns {string} Truncated string
 */
function truncate(str, maxLength = 50) {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength - 3) + "...";
}

/**
 * Capitalize first letter
 * @param {string} str - String to capitalize
 * @returns {string} Capitalized string
 */
function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Format category for display
 * @param {string} category - Category name
 * @returns {string} Formatted category
 */
function formatCategory(category) {
  const categoryEmoji = {
    food: "🍔",
    transport: "🚗",
    accommodation: "🏠",
    entertainment: "🎬",
    shopping: "🛍️",
    utilities: "💡",
    other: "📌",
  };

  return `${categoryEmoji[category] || "📌"} ${capitalize(category)}`;
}

/**
 * Format duration in milliseconds to human-readable
 * @param {number} ms - Duration in milliseconds
 * @returns {string} Human-readable duration
 */
function formatDuration(ms) {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) return `${hours}h ${minutes % 60}m`;
  if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
  return `${seconds}s`;
}

module.exports = {
  formatCurrency,
  formatNumber,
  formatDate,
  formatDateTime,
  formatPercentage,
  truncate,
  capitalize,
  formatCategory,
  formatDuration,
};
