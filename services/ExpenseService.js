/**
 * Expense Service
 * Business logic for expense operations
 */

const store = require("../lib/store");
const {
  validateExpenseCreation,
  validateExpenseUpdate,
} = require("../utils/validation");

class ExpenseService {
  /**
   * Create expense
   * @param {string} groupId - Group ID
   * @param {object} data - Expense data
   * @returns {object} Created expense
   */
  static createExpense(groupId, data) {
    const database = store.load();
    const group = database.groups.find((g) => g.id === groupId);

    if (!group) {
      const error = new Error("Group not found");
      error.name = "NotFoundError";
      throw error;
    }

    const validation = validateExpenseCreation(data, group.members);
    if (!validation.valid) {
      const error = new Error(validation.errors.join(", "));
      error.name = "ValidationError";
      throw error;
    }

    const expense = {
      id: store.newId(),
      description: data.description.trim(),
      amount: Math.round(data.amount * 100) / 100,
      paidBy: data.paidBy,
      splitAmong: data.splitAmong,
      category: data.category || "other",
      exactSplits: data.exactSplits || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    group.expenses.push(expense);
    group.updatedAt = new Date().toISOString();
    store.save(database);

    return expense;
  }

  /**
   * Get expense
   * @param {string} groupId - Group ID
   * @param {string} expenseId - Expense ID
   * @returns {object} Expense object
   */
  static getExpense(groupId, expenseId) {
    const database = store.load();
    const group = database.groups.find((g) => g.id === groupId);

    if (!group) {
      const error = new Error("Group not found");
      error.name = "NotFoundError";
      throw error;
    }

    const expense = group.expenses.find((e) => e.id === expenseId);

    if (!expense) {
      const error = new Error("Expense not found");
      error.name = "NotFoundError";
      throw error;
    }

    return expense;
  }

  /**
   * Update expense
   * @param {string} groupId - Group ID
   * @param {string} expenseId - Expense ID
   * @param {object} updates - Update data
   * @returns {object} Updated expense
   */
  static updateExpense(groupId, expenseId, updates) {
    const database = store.load();
    const group = database.groups.find((g) => g.id === groupId);

    if (!group) {
      const error = new Error("Group not found");
      error.name = "NotFoundError";
      throw error;
    }

    const expense = group.expenses.find((e) => e.id === expenseId);

    if (!expense) {
      const error = new Error("Expense not found");
      error.name = "NotFoundError";
      throw error;
    }

    const validation = validateExpenseUpdate(updates, group.members);
    if (!validation.valid) {
      const error = new Error(validation.errors.join(", "));
      error.name = "ValidationError";
      throw error;
    }

    if (updates.description !== undefined) {
      expense.description = updates.description.trim();
    }

    if (updates.amount !== undefined) {
      expense.amount = Math.round(updates.amount * 100) / 100;
    }

    if (updates.paidBy !== undefined) {
      expense.paidBy = updates.paidBy;
    }

    if (updates.splitAmong !== undefined) {
      expense.splitAmong = updates.splitAmong;
    }

    if (updates.category !== undefined) {
      expense.category = updates.category;
    }

    expense.updatedAt = new Date().toISOString();
    group.updatedAt = new Date().toISOString();
    store.save(database);

    return expense;
  }

  /**
   * Delete expense
   * @param {string} groupId - Group ID
   * @param {string} expenseId - Expense ID
   * @returns {boolean} True if deleted
   */
  static deleteExpense(groupId, expenseId) {
    const database = store.load();
    const group = database.groups.find((g) => g.id === groupId);

    if (!group) {
      const error = new Error("Group not found");
      error.name = "NotFoundError";
      throw error;
    }

    const idx = group.expenses.findIndex((e) => e.id === expenseId);

    if (idx === -1) {
      const error = new Error("Expense not found");
      error.name = "NotFoundError";
      throw error;
    }

    group.expenses.splice(idx, 1);
    group.updatedAt = new Date().toISOString();
    store.save(database);

    return true;
  }

  /**
   * Get expenses with filters
   * @param {string} groupId - Group ID
   * @param {object} filters - Filter options
   * @returns {array} Filtered expenses
   */
  static getExpenses(groupId, filters = {}) {
    const database = store.load();
    const group = database.groups.find((g) => g.id === groupId);

    if (!group) {
      const error = new Error("Group not found");
      error.name = "NotFoundError";
      throw error;
    }

    let expenses = [...group.expenses];

    // Filter by category
    if (filters.category) {
      expenses = expenses.filter((e) => e.category === filters.category);
    }

    // Filter by member
    if (filters.memberId) {
      expenses = expenses.filter(
        (e) => e.paidBy === filters.memberId || e.splitAmong.includes(filters.memberId)
      );
    }

    // Filter by date range
    if (filters.startDate) {
      const start = new Date(filters.startDate);
      expenses = expenses.filter((e) => new Date(e.createdAt) >= start);
    }

    if (filters.endDate) {
      const end = new Date(filters.endDate);
      expenses = expenses.filter((e) => new Date(e.createdAt) <= end);
    }

    // Sort by date (newest first)
    expenses.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    return expenses;
  }
}

module.exports = ExpenseService;
