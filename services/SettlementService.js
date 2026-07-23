/**
 * Settlement Service
 * Settlement calculation and optimization logic
 */

const store = require("../lib/store");
const { settle } = require("../lib/settle");

class SettlementService {
  /**
   * Get settlement plan for a group
   * @param {string} groupId - Group ID
   * @returns {object} Settlement plan with balances and transfers
   */
  static getSettlement(groupId) {
    const database = store.load();
    const group = database.groups.find((g) => g.id === groupId);

    if (!group) {
      const error = new Error("Group not found");
      error.name = "NotFoundError";
      throw error;
    }

    // Calculate settlement using the algorithm
    const result = settle(group.members, group.expenses);

    // Add metadata
    return {
      groupId,
      groupName: group.name,
      ...result,
      totalExpenses: group.expenses.length,
      totalAmount: group.expenses.reduce((sum, e) => sum + e.amount, 0),
      membersInvolved: group.members.length,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Get settlement summary (simpler format for frontend)
   * @param {string} groupId - Group ID
   * @returns {object} Settlement summary
   */
  static getSettlementSummary(groupId) {
    const database = store.load();
    const group = database.groups.find((g) => g.id === groupId);

    if (!group) {
      const error = new Error("Group not found");
      error.name = "NotFoundError";
      throw error;
    }

    const result = settle(group.members, group.expenses);

    // Get member info map
    const memberMap = Object.fromEntries(
      group.members.map((m) => [m.id, m.name])
    );

    return {
      settled: result.plan.length === 0,
      transfers: result.plan.length,
      naiveTransfers: result.naiveTransferCount,
      optimized: result.naiveTransferCount - result.plan.length,
      balances: result.balances.map((b) => ({
        ...b,
        owes: b.balance < 0,
        owed: b.balance > 0,
      })),
      plan: result.plan.map((t) => ({
        from: t.from,
        fromName: memberMap[t.from],
        to: t.to,
        toName: memberMap[t.to],
        amount: t.amount,
      })),
    };
  }

  /**
   * Get individual member settlement
   * @param {string} groupId - Group ID
   * @param {string} memberId - Member ID
   * @returns {object} Member's settlement info
   */
  static getMemberSettlement(groupId, memberId) {
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

    const result = settle(group.members, group.expenses);
    const memberBalance = result.balances.find((b) => b.id === memberId);
    const memberPlan = result.plan.filter(
      (t) => t.from === memberId || t.to === memberId
    );

    const memberMap = Object.fromEntries(
      group.members.map((m) => [m.id, m.name])
    );

    return {
      memberId,
      memberName: member.name,
      balance: memberBalance?.balance || 0,
      status: memberBalance?.balance > 0 ? "owed" : memberBalance?.balance < 0 ? "owes" : "settled",
      transactions: memberPlan.map((t) => ({
        from: memberMap[t.from],
        to: memberMap[t.to],
        amount: t.amount,
        type: t.from === memberId ? "pay" : "receive",
      })),
    };
  }

  /**
   * Export settlement as JSON
   * @param {string} groupId - Group ID
   * @returns {string} JSON string
   */
  static exportSettlementJSON(groupId) {
    const settlement = this.getSettlement(groupId);
    return JSON.stringify(settlement, null, 2);
  }

  /**
   * Export settlement as CSV
   * @param {string} groupId - Group ID
   * @returns {string} CSV string
   */
  static exportSettlementCSV(groupId) {
    const settlement = this.getSettlement(groupId);

    let csv = "Settlement Report\n";
    csv += `Group: ${settlement.groupName}\n`;
    csv += `Date: ${settlement.timestamp}\n\n`;

    csv += "Balances\n";
    csv += "Name,Balance (₹),Status\n";
    settlement.balances.forEach((b) => {
      const status = b.balance > 0 ? "Owed" : b.balance < 0 ? "Owes" : "Settled";
      csv += `${b.name},${b.balance.toFixed(2)},${status}\n`;
    });

    csv += "\nTransfers Needed\n";
    csv += "From,To,Amount (₹)\n";
    settlement.plan.forEach((t) => {
      csv += `${t.fromName},${t.toName},${t.amount.toFixed(2)}\n`;
    });

    return csv;
  }

  /**
   * Check if group is settled (no transfers needed)
   * @param {string} groupId - Group ID
   * @returns {boolean} True if settled
   */
  static isSettled(groupId) {
    const settlement = this.getSettlement(groupId);
    return settlement.plan.length === 0;
  }

  /**
   * Get settlement statistics
   * @param {string} groupId - Group ID
   * @returns {object} Statistics
   */
  static getStatistics(groupId) {
    const database = store.load();
    const group = database.groups.find((g) => g.id === groupId);

    if (!group) {
      const error = new Error("Group not found");
      error.name = "NotFoundError";
      throw error;
    }

    const settlement = settle(group.members, group.expenses);

    const totalAmount = group.expenses.reduce((sum, e) => sum + e.amount, 0);
    const averagePerExpense = group.expenses.length > 0 ? totalAmount / group.expenses.length : 0;

    const expensesByCategory = {};
    group.expenses.forEach((e) => {
      const cat = e.category || "other";
      expensesByCategory[cat] = (expensesByCategory[cat] || 0) + e.amount;
    });

    const expensesByMember = {};
    group.members.forEach((m) => {
      expensesByMember[m.id] = {
        memberId: m.id,
        name: m.name,
        paid: 0,
        split: 0,
      };
    });

    group.expenses.forEach((e) => {
      expensesByMember[e.paidBy].paid += e.amount;
      const perPerson = e.amount / e.splitAmong.length;
      e.splitAmong.forEach((memberId) => {
        expensesByMember[memberId].split += perPerson;
      });
    });

    return {
      totalExpenses: group.expenses.length,
      totalAmount,
      averagePerExpense,
      expensesByCategory,
      expensesByMember: Object.values(expensesByMember),
      transfers: settlement.plan.length,
      naiveTransfers: settlement.naiveTransferCount,
      optimized: settlement.naiveTransferCount - settlement.plan.length,
    };
  }
}

module.exports = SettlementService;
