/**
 * Settle — Settlement optimizer
 * Computes minimal cash flow plan for splitting group expenses
 * 
 * Algorithm:
 * 1. Net balances — compute everyone's balance in paise (minor units)
 * 2. Greedy matching — sort creditors/debtors by size, match largest pairs
 * 3. Result — at most n-1 transfers instead of n(n-1)/2 pairwise IOUs
 */

/**
 * Calculate net balances for all group members based on expenses
 * 
 * @param {Array} members - Group members with id and name
 * @param {Array} expenses - Expenses with amount, paidBy, splitAmong
 * @returns {Array} Array of {id, name, balance} in paise
 * 
 * TODO: Implement balance calculation
 * - Money as integers (paise)
 * - Deterministic rounding for equal splits
 * - Support exactSplits if provided
 */
function calculateBalances(members, expenses) {
  const balances = {};
  
  // Initialize all members with 0 balance
  members.forEach(member => {
    balances[member.id] = { id: member.id, name: member.name, balance: 0 };
  });

  // Process each expense
  expenses.forEach(expense => {
    const amountPaise = Math.round(expense.amount * 100); // Convert to paise
    
    // Credit the payer
    balances[expense.paidBy].balance += amountPaise;

    // Debit each participant
    if (expense.exactSplits && typeof expense.exactSplits === 'object') {
      // Use exact splits if provided
      Object.entries(expense.exactSplits).forEach(([memberId, share]) => {
        const sharePaise = Math.round(share * 100);
        balances[memberId].balance -= sharePaise;
      });
    } else {
      // Equal split
      const splitCount = expense.splitAmong.length;
      const perPersonPaise = Math.floor(amountPaise / splitCount);
      const remainder = amountPaise % splitCount;

      expense.splitAmong.forEach((memberId, idx) => {
        // Distribute remainder deterministically to first N members
        const share = perPersonPaise + (idx < remainder ? 1 : 0);
        balances[memberId].balance -= share;
      });
    }
  });

  return Object.values(balances);
}

/**
 * Compute minimal transfer plan to settle all balances
 * 
 * @param {Array} balances - Array of {id, name, balance}
 * @returns {Object} { plan, naiveTransferCount }
 * 
 * TODO: Implement greedy matching
 * - Sort creditors (positive balance) and debtors (negative balance)
 * - Repeatedly match largest creditor with largest debtor
 * - Each match fully zeroes at least one person
 * - Terminates in at most n-1 transfers
 */
function computeSettlement(balances) {
  // Count how many pairwise IOUs would exist (naive approach)
  const naiveTransferCount = balances.filter(b => Math.abs(b.balance) > 0.005).length - 1;

  // Separate creditors (positive) and debtors (negative)
  const creditors = balances
    .filter(b => b.balance > 0.005)
    .sort((a, b) => b.balance - a.balance);
  
  const debtors = balances
    .filter(b => b.balance < -0.005)
    .map(b => ({ ...b, balance: -b.balance })) // Make positive for easier math
    .sort((a, b) => b.balance - a.balance);

  const plan = [];
  let i = 0, j = 0;

  // Greedy matching: repeatedly match largest creditor with largest debtor
  while (i < creditors.length && j < debtors.length) {
    const creditor = creditors[i];
    const debtor = debtors[j];

    // How much can debtor pay to creditor?
    const transferAmount = Math.min(creditor.balance, debtor.balance);

    plan.push({
      from: debtor.id,
      fromName: debtor.name,
      to: creditor.id,
      toName: creditor.name,
      amount: Math.round(transferAmount) / 100 // Convert back to rupees
    });

    // Update balances
    creditor.balance -= transferAmount;
    debtor.balance -= transferAmount;

    // Move to next if one is exhausted
    if (creditor.balance < 0.005) i++;
    if (debtor.balance < 0.005) j++;
  }

  return { plan, naiveTransferCount };
}

/**
 * Full settlement: balances + minimal transfer plan
 * 
 * @param {Array} members - Group members
 * @param {Array} expenses - Group expenses
 * @returns {Object} { balances, plan, naiveTransferCount }
 */
function settle(members, expenses) {
  const balances = calculateBalances(members, expenses);
  const { plan, naiveTransferCount } = computeSettlement(balances);
  
  return {
    balances: balances.map(b => ({
      id: b.id,
      name: b.name,
      balance: Math.round(b.balance) / 100 // Convert back to rupees
    })),
    plan,
    naiveTransferCount
  };
}

module.exports = { settle, calculateBalances, computeSettlement };
