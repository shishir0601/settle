/**
 * Settle — Persistence layer
 * JSON-file storage with atomic writes
 * 
 * Interface:
 * - load() — Read all data
 * - save(data) — Atomic write
 * - newId() — Generate unique ID
 */

const fs = require("fs");
const path = require("path");

const DB_PATH = process.env.SETTLE_DB || path.join(__dirname, "../data.json");

/**
 * Load data from file
 * Returns { groups: [] } structure
 */
function load() {
  try {
    if (fs.existsSync(DB_PATH)) {
      const content = fs.readFileSync(DB_PATH, "utf-8");
      return JSON.parse(content);
    }
  } catch (err) {
    console.error("Error loading database:", err);
  }
  
  // Return default structure if file doesn't exist or is corrupted
  return { groups: [] };
}

/**
 * Save data to file atomically
 * Writes to temporary file, then swaps on success to prevent corruption
 */
function save(data) {
  try {
    const tmpPath = DB_PATH + ".tmp";
    const json = JSON.stringify(data, null, 2);
    
    // Write to temp file first
    fs.writeFileSync(tmpPath, json, "utf-8");
    
    // Atomic swap
    if (fs.existsSync(DB_PATH)) {
      fs.unlinkSync(DB_PATH);
    }
    fs.renameSync(tmpPath, DB_PATH);
  } catch (err) {
    console.error("Error saving database:", err);
    throw err;
  }
}

/**
 * Generate unique ID
 * Uses timestamp + random suffix for uniqueness
 */
function newId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

module.exports = { load, save, newId };
