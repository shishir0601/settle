/**
 * Member Service
 * Business logic for member operations
 */

const store = require("../lib/store");
const { validateMemberCreation } = require("../utils/validation");

class MemberService {
  /**
   * Add member to group
   * @param {string} groupId - Group ID
   * @param {object} data - Member data { name }
   * @returns {object} Updated group
   */
  static addMember(groupId, data) {
    const validation = validateMemberCreation(data);
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

    // Check for duplicates (case-insensitive)
    const nameExists = group.members.some(
      (m) => m.name.toLowerCase() === data.name.trim().toLowerCase()
    );

    if (nameExists) {
      const error = new Error("Member with this name already exists");
      error.statusCode = 409;
      throw error;
    }

    const member = {
      id: store.newId(),
      name: data.name.trim(),
    };

    group.members.push(member);
    group.updatedAt = new Date().toISOString();
    store.save(database);

    return { group, member };
  }

  /**
   * Get member
   * @param {string} groupId - Group ID
   * @param {string} memberId - Member ID
   * @returns {object} Member object
   */
  static getMember(groupId, memberId) {
    const database = store.load();
    const group = database.groups.find((g) => g.id === groupId);

    if (!group) {
      const error = new Error("Group not found");
      error.name = "NotFoundError";
      throw error;
    }

    const member = group.members.find((m) => m.id === memberId);

    if (!member) {
      const error = new Error("Member not found");
      error.name = "NotFoundError";
      throw error;
    }

    return member;
  }

  /**
   * Delete member (only if not involved in any expenses)
   * @param {string} groupId - Group ID
   * @param {string} memberId - Member ID
   * @returns {boolean} True if deleted
   */
  static deleteMember(groupId, memberId) {
    const database = store.load();
    const group = database.groups.find((g) => g.id === groupId);

    if (!group) {
      const error = new Error("Group not found");
      error.name = "NotFoundError";
      throw error;
    }

    // Check if member is involved in any expenses
    const involved = group.expenses.some(
      (e) => e.paidBy === memberId || e.splitAmong.includes(memberId)
    );

    if (involved) {
      const error = new Error("Cannot delete member involved in expenses");
      error.statusCode = 409;
      throw error;
    }

    const idx = group.members.findIndex((m) => m.id === memberId);

    if (idx === -1) {
      const error = new Error("Member not found");
      error.name = "NotFoundError";
      throw error;
    }

    group.members.splice(idx, 1);
    group.updatedAt = new Date().toISOString();
    store.save(database);

    return true;
  }

  /**
   * Get member expenses
   * @param {string} groupId - Group ID
   * @param {string} memberId - Member ID
   * @returns {object} Member expense summary
   */
  static getMemberExpenses(groupId, memberId) {
    const database = store.load();
    const group = database.groups.find((g) => g.id === groupId);

    if (!group) {
      const error = new Error("Group not found");
      error.name = "NotFoundError";
      throw error;
    }

    const member = group.members.find((m) => m.id === memberId);

    if (!member) {
      const error = new Error("Member not found");
      error.name = "NotFoundError";
      throw error;
    }

    const paid = group.expenses.filter((e) => e.paidBy === memberId);
    const split = group.expenses.filter((e) => e.splitAmong.includes(memberId));

    const paidAmount = paid.reduce((sum, e) => sum + e.amount, 0);
    const splitAmount = split.reduce((sum, e) => sum + e.amount / e.splitAmong.length, 0);

    return {
      member,
      paid: { count: paid.length, amount: paidAmount, expenses: paid },
      split: { count: split.length, amount: splitAmount, expenses: split },
      balance: paidAmount - splitAmount,
    };
  }
}

module.exports = MemberService;
