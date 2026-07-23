/**
 * Settle — Production-Grade HTTP Server
 * Clean architecture with middleware, services, and error handling
 */

const http = require("http");
const path = require("path");
const fs = require("fs");

// Configuration & Constants
const constants = require("./config/constants");

// Middleware
const errorHandler = require("./middleware/errorHandler");
const logger = require("./middleware/requestLogger");

// Services
const GroupService = require("./services/GroupService");
const MemberService = require("./services/MemberService");
const ExpenseService = require("./services/ExpenseService");
const SettlementService = require("./services/SettlementService");

// Utilities
const responses = require("./utils/responses");
const validation = require("./utils/validation");

// ============================================================================
// ROUTER
// ============================================================================

/**
 * Parse request URL into components
 * @param {http.IncomingMessage} req - Request object
 * @returns {object} Parsed request { method, pathname, params }
 */
function parseURL(req) {
  const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);
  const pathname = url.pathname;
  const method = req.method.toUpperCase();

  return { pathname, method, url, query: Object.fromEntries(url.searchParams) };
}

/**
 * Route handler decorator
 * @param {string} method - HTTP method
 * @param {string} pattern - URL pattern
 * @param {Function} handler - Handler function
 * @returns {object} Route definition
 */
function route(method, pattern, handler) {
  return { method, pattern, handler };
}

/**
 * Match URL to route pattern
 * @param {string} pathname - Request pathname
 * @param {string} pattern - Route pattern
 * @returns {object|null} Matched params or null
 */
function matchRoute(pathname, pattern) {
  const patternParts = pattern.split("/").filter(Boolean);
  const pathParts = pathname.split("/").filter(Boolean);

  if (patternParts.length !== pathParts.length) return null;

  const params = {};
  for (let i = 0; i < patternParts.length; i++) {
    if (patternParts[i].startsWith(":")) {
      const paramName = patternParts[i].slice(1);
      params[paramName] = pathParts[i];
    } else if (patternParts[i] !== pathParts[i]) {
      return null;
    }
  }

  return params;
}

// ============================================================================
// ROUTES
// ============================================================================

const routes = [
  // Group routes
  route("POST", "/api/groups", async (req, res, body) => {
    const group = GroupService.createGroup(body);
    responses.sendSuccess(res, constants.HTTP_STATUS.CREATED, group, constants.SUCCESS.GROUP_CREATED);
  }),

  route("GET", "/api/groups", async (req, res) => {
    const groups = GroupService.getAllGroups();
    responses.sendSuccess(res, constants.HTTP_STATUS.OK, { groups });
  }),

  route("GET", "/api/groups/:groupId", async (req, res, body, params) => {
    const group = GroupService.getGroup(params.groupId);
    responses.sendSuccess(res, constants.HTTP_STATUS.OK, group);
  }),

  route("PUT", "/api/groups/:groupId", async (req, res, body, params) => {
    const group = GroupService.updateGroup(params.groupId, body);
    responses.sendSuccess(res, constants.HTTP_STATUS.OK, group, constants.SUCCESS.GROUP_UPDATED);
  }),

  route("DELETE", "/api/groups/:groupId", async (req, res, body, params) => {
    GroupService.deleteGroup(params.groupId);
    responses.sendSuccess(res, constants.HTTP_STATUS.OK, null, constants.SUCCESS.GROUP_DELETED);
  }),

  // Member routes
  route("POST", "/api/groups/:groupId/members", async (req, res, body, params) => {
    const result = MemberService.addMember(params.groupId, body);
    responses.sendSuccess(res, constants.HTTP_STATUS.CREATED, result.group, constants.SUCCESS.MEMBER_ADDED);
  }),

  // Expense routes
  route("POST", "/api/groups/:groupId/expenses", async (req, res, body, params) => {
    const expense = ExpenseService.createExpense(params.groupId, body);
    responses.sendSuccess(res, constants.HTTP_STATUS.CREATED, expense, constants.SUCCESS.EXPENSE_ADDED);
  }),

  route("GET", "/api/groups/:groupId/expenses", async (req, res, body, params, query) => {
    const expenses = ExpenseService.getExpenses(params.groupId, query);
    responses.sendSuccess(res, constants.HTTP_STATUS.OK, { expenses });
  }),

  route("PUT", "/api/groups/:groupId/expenses/:expenseId", async (req, res, body, params) => {
    const expense = ExpenseService.updateExpense(params.groupId, params.expenseId, body);
    responses.sendSuccess(res, constants.HTTP_STATUS.OK, expense, constants.SUCCESS.EXPENSE_UPDATED);
  }),

  route("DELETE", "/api/groups/:groupId/expenses/:expenseId", async (req, res, body, params) => {
    ExpenseService.deleteExpense(params.groupId, params.expenseId);
    responses.sendSuccess(res, constants.HTTP_STATUS.OK, null, constants.SUCCESS.EXPENSE_DELETED);
  }),

  // Settlement routes
  route("GET", "/api/groups/:groupId/settlement", async (req, res, body, params) => {
    const settlement = SettlementService.getSettlement(params.groupId);
    responses.sendSuccess(res, constants.HTTP_STATUS.OK, settlement);
  }),

  route("GET", "/api/groups/:groupId/settlement/summary", async (req, res, body, params) => {
    const summary = SettlementService.getSettlementSummary(params.groupId);
    responses.sendSuccess(res, constants.HTTP_STATUS.OK, summary);
  }),

  route("GET", "/api/groups/:groupId/settlement/member/:memberId", async (req, res, body, params) => {
    const memberSettlement = SettlementService.getMemberSettlement(params.groupId, params.memberId);
    responses.sendSuccess(res, constants.HTTP_STATUS.OK, memberSettlement);
  }),

  route("GET", "/api/groups/:groupId/stats", async (req, res, body, params) => {
    const stats = SettlementService.getStatistics(params.groupId);
    responses.sendSuccess(res, constants.HTTP_STATUS.OK, stats);
  }),

  route("GET", "/api/groups/:groupId/export/json", async (req, res, body, params) => {
    const json = SettlementService.exportSettlementJSON(params.groupId);
    responses.sendFile(res, json, `settle-${params.groupId}.json`, "application/json");
  }),

  route("GET", "/api/groups/:groupId/export/csv", async (req, res, body, params) => {
    const csv = SettlementService.exportSettlementCSV(params.groupId);
    responses.sendFile(res, csv, `settle-${params.groupId}.csv`, "text/csv");
  }),
];

// ============================================================================
// STATIC FILE SERVING
// ============================================================================

function serveStatic(req, res, pathname) {
  const filePath = path.join(
    constants.PUBLIC_DIR,
    pathname === "/" ? "index.html" : pathname
  );

  // Security: prevent directory traversal
  if (!filePath.startsWith(constants.PUBLIC_DIR)) {
    res.writeHead(403, { "Content-Type": "text/plain" });
    res.end("Forbidden");
    return;
  }

  try {
    const ext = path.extname(filePath);
    const mimeType = constants.MIME_TYPES[ext] || "application/octet-stream";
    const content = fs.readFileSync(filePath);

    res.writeHead(200, { "Content-Type": mimeType });
    res.end(content);
  } catch (err) {
    if (err.code === "ENOENT") {
      res.writeHead(404, { "Content-Type": "text/plain" });
      res.end("Not Found");
    } else {
      res.writeHead(500, { "Content-Type": "text/plain" });
      res.end("Server Error");
    }
  }
}

// ============================================================================
// SERVER
// ============================================================================

const server = http.createServer(async (req, res) => {
  const startTime = Date.now();
  const { pathname, method, query } = parseURL(req);

  // Set CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("X-Content-Type-Options", "nosniff");

  // Handle OPTIONS
  if (method === "OPTIONS") {
    res.writeHead(200);
    res.end();
    return;
  }

  try {
    // API routes
    if (pathname.startsWith("/api/")) {
      // Parse body for non-GET requests
      let body = {};
      if (method !== "GET") {
        body = await new Promise((resolve, reject) => {
          errorHandler.parseJSON(req, (err, data) => {
            if (err) reject(err);
            else resolve(data);
          });
        });
      }

      // Find matching route
      let handled = false;
      for (const r of routes) {
        if (r.method !== method) continue;

        const params = matchRoute(pathname, r.pattern);
        if (params) {
          await r.handler(req, res, body, params, query);
          handled = true;
          break;
        }
      }

      if (!handled) {
        responses.sendError(res, 404, "API endpoint not found");
      }
    } else {
      // Static files
      serveStatic(req, res, pathname);
    }
  } catch (error) {
    errorHandler.handleError(error, res, { path: pathname, method });
  } finally {
    const duration = Date.now() - startTime;
    const statusCode = res.statusCode || 500;
    logger.logRequest(method, pathname, statusCode, duration);
  }
});

// ============================================================================
// STARTUP
// ============================================================================

if (require.main === module) {
  const PORT = constants.PORT;
  server.listen(PORT, () => {
    logger.info(`✅ Settle server running at http://localhost:${PORT}`);
    logger.info(`Environment: ${constants.NODE_ENV}`);
  });

  // Graceful shutdown
  process.on("SIGTERM", () => {
    logger.info("SIGTERM received, shutting down gracefully...");
    server.close(() => {
      logger.info("Server closed");
      process.exit(0);
    });
  });
}

module.exports = server;
