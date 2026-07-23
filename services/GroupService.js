/**
 * Group Service
 * Business logic for group operations
 */

const store = require("../lib/store");
const { validateGroupCreation, validateGroupUpdate } = require("../utils/validation");

class GroupService {
  /**
   * Create a new group
   * @param {object} data - Group data { name, members }
   * @returns {object} Created group
   */
  static createGroup(data) {
    const validation = validateGroupCreation(data);
    if (!validation.valid) {
      const error = new Error(validation.errors.join(", "));
      error.name = "ValidationError";
      throw error;
    }

    const database = store.load();
    const group = {
      id: store.newId(),
      name: data.name.trim(),
      members: data.members.map((name) => ({
        id: store.newId(),
        name: name.trim(),
      })),
      expenses: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    database.groups.push(group);
    store.save(database);

    return group;
  }

  /**
   * Get all groups
   * @returns {array} Groups list
   */
  static getAllGroups() {
    const database = store.load();
    return database.groups.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  /**
   * Get group by ID
   * @param {string} groupId - Group ID
   * @returns {object} Group object
   */
  static getGroup(groupId) {
    const database = store.load();
    const group = database.groups.find((g) => g.id === groupId);

    if (!group) {
      const error = new Error("Group not found");
      error.name = "NotFoundError";
      throw error;
    }

    return group;
  }

  /**
   * Update group
   * @param {string} groupId - Group ID
   * @param {object} updates - Update data
   * @returns {object} Updated group
   */
  static updateGroup(groupId, updates) {
    const validation = validateGroupUpdate(updates);
    if (!validation.valid) {
      const error = new Error(validation.errors.join(", "));
      error.name = "ValidationError";
      throw error;
    }

    const database = store.load();
    const group = database.groups.find((g) => g.id === groupId);

    if (!group) {
      const error = new Error("Group not found");
      error.name = "NotFoundError";
      throw error;
    }

    if (updates.name) {
      group.name = updates.name.trim();
    }

    group.updatedAt = new Date().toISOString();
    store.save(database);

    return group;
  }

  /**
   * Delete group
   * @param {string} groupId - Group ID
   * @returns {boolean} True if deleted
   */
  static deleteGroup(groupId) {
    const database = store.load();
    const idx = database.groups.findIndex((g) => g.id === groupId);

    if (idx === -1) {
      const error = new Error("Group not found");
      error.name = "NotFoundError";
      throw error;
    }

    database.groups.splice(idx, 1);
    store.save(database);

    return true;
  }

  /**
   * Get group summary
   * @param {string} groupId - Group ID
   * @returns {object} Summary with stats
   */
  static getGroupSummary(groupId) {
    const group = this.getGroup(groupId);

    const totalExpenses = group.expenses.length;
    const totalAmount = group.expenses.reduce((sum, e) => sum + e.amount, 0);
    const averageExpense = totalExpenses > 0 ? totalAmount / totalExpenses : 0;

    const expensesByCategory = {};
    group.expenses.forEach((e) => {
      const cat = e.category || "other";
      expensesByCategory[cat] = (expensesByCategory[cat] || 0) + e.amount;
    });

    const memberStats = {};
    group.members.forEach((m) => {
      memberStats[m.id] = {
        id: m.id,
        name: m.name,
        expenses: 0,
        paid: 0,
      };
    });

    group.expenses.forEach((e) => {
      const perPerson = e.amount / e.splitAmong.length;
      e.splitAmong.forEach((memberId) => {
        if (memberStats[memberId]) {
          memberStats[memberId].expenses += perPerson;
        }
      });
      if (memberStats[e.paidBy]) {
        memberStats[e.paidBy].paid += e.amount;
      }
    });

    return {
      group,
      stats: {
        totalExpenses,
        totalAmount,
        averageExpense,
        expensesByCategory,
        memberStats: Object.values(memberStats),
      },
    };
  }
}

module.exports = GroupService;
