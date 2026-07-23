/**
 * Validation Utilities
 * Centralized validation logic for data
 */

const constants = require("../config/constants");

/**
 * Validate group creation data
 * @param {object} data - Group data
 * @returns {object} Validation result { valid: boolean, errors: array }
 */
function validateGroupCreation(data) {
  const errors = [];

  if (!data.name || typeof data.name !== "string") {
    errors.push("Group name is required and must be a string");
  } else if (data.name.trim().length < constants.VALIDATION.GROUP_NAME_MIN) {
    errors.push("Group name cannot be empty");
  } else if (data.name.trim().length > constants.VALIDATION.GROUP_NAME_MAX) {
    errors.push(`Group name must be at most ${constants.VALIDATION.GROUP_NAME_MAX} characters`);
  }

  if (!Array.isArray(data.members) || data.members.length === 0) {
    errors.push("Members must be a non-empty array");
  } else if (data.members.length < constants.VALIDATION.MEMBERS_MIN) {
    errors.push(`At least ${constants.VALIDATION.MEMBERS_MIN} members required`);
  } else if (data.members.length > constants.VALIDATION.MEMBERS_MAX) {
    errors.push(`Maximum ${constants.VALIDATION.MEMBERS_MAX} members allowed`);
  } else {
    const invalidMembers = data.members.filter(
      (m) => !m || typeof m !== "string" || m.trim().length === 0
    );
    if (invalidMembers.length > 0) {
      errors.push("All member names must be non-empty strings");
    }

    const uniqueMembers = new Set(data.members.map((m) => m.toLowerCase().trim()));
    if (uniqueMembers.size !== data.members.length) {
      errors.push("Member names must be unique");
    }
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Validate member creation
 * @param {object} data - Member data
 * @returns {object} Validation result
 */
function validateMemberCreation(data) {
  const errors = [];

  if (!data.name || typeof data.name !== "string") {
    errors.push("Member name is required and must be a string");
  } else if (data.name.trim().length === 0) {
    errors.push("Member name cannot be empty");
  } else if (data.name.trim().length > constants.VALIDATION.MEMBER_NAME_MAX) {
    errors.push(`Member name must be at most ${constants.VALIDATION.MEMBER_NAME_MAX} characters`);
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Validate expense creation
 * @param {object} data - Expense data
 * @param {array} groupMembers - Group members for validation
 * @returns {object} Validation result
 */
function validateExpenseCreation(data, groupMembers = []) {
  const errors = [];
  const memberIds = new Set(groupMembers.map((m) => m.id));

  if (!data.description || typeof data.description !== "string") {
    errors.push("Description is required and must be a string");
  } else if (data.description.trim().length === 0) {
    errors.push("Description cannot be empty");
  } else if (data.description.trim().length > constants.VALIDATION.EXPENSE_DESC_MAX) {
    errors.push(`Description must be at most ${constants.VALIDATION.EXPENSE_DESC_MAX} characters`);
  }

  if (typeof data.amount !== "number" || data.amount <= 0) {
    errors.push("Amount must be a positive number");
  } else if (data.amount > constants.VALIDATION.EXPENSE_AMOUNT_MAX) {
    errors.push(`Amount must not exceed ${constants.VALIDATION.EXPENSE_AMOUNT_MAX}`);
  }

  if (!data.paidBy) {
    errors.push("Payer (paidBy) is required");
  } else if (!memberIds.has(data.paidBy)) {
    errors.push("Payer is not a valid group member");
  }

  if (!Array.isArray(data.splitAmong) || data.splitAmong.length === 0) {
    errors.push("Split must be a non-empty array");
  } else if (data.splitAmong.length > constants.VALIDATION.EXPENSE_SPLIT_MAX) {
    errors.push(`Split cannot exceed ${constants.VALIDATION.EXPENSE_SPLIT_MAX} members`);
  } else {
    const invalidSplits = data.splitAmong.filter((id) => !memberIds.has(id));
    if (invalidSplits.length > 0) {
      errors.push("Some split members are not valid group members");
    }
  }

  if (data.category && !constants.EXPENSE_CATEGORIES.includes(data.category)) {
    errors.push(`Invalid category. Valid options: ${constants.EXPENSE_CATEGORIES.join(", ")}`);
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Validate expense update
 * @param {object} data - Update data
 * @param {array} groupMembers - Group members for validation
 * @returns {object} Validation result
 */
function validateExpenseUpdate(data, groupMembers = []) {
  const errors = [];
  const memberIds = new Set(groupMembers.map((m) => m.id));

  if (data.description !== undefined) {
    if (typeof data.description !== "string" || data.description.trim().length === 0) {
      errors.push("Description must be a non-empty string");
    } else if (data.description.trim().length > constants.VALIDATION.EXPENSE_DESC_MAX) {
      errors.push(`Description must be at most ${constants.VALIDATION.EXPENSE_DESC_MAX} characters`);
    }
  }

  if (data.amount !== undefined) {
    if (typeof data.amount !== "number" || data.amount <= 0) {
      errors.push("Amount must be a positive number");
    } else if (data.amount > constants.VALIDATION.EXPENSE_AMOUNT_MAX) {
      errors.push(`Amount must not exceed ${constants.VALIDATION.EXPENSE_AMOUNT_MAX}`);
    }
  }

  if (data.paidBy !== undefined && !memberIds.has(data.paidBy)) {
    errors.push("Payer is not a valid group member");
  }

  if (data.splitAmong !== undefined) {
    if (!Array.isArray(data.splitAmong) || data.splitAmong.length === 0) {
      errors.push("Split must be a non-empty array");
    } else {
      const invalidSplits = data.splitAmong.filter((id) => !memberIds.has(id));
      if (invalidSplits.length > 0) {
        errors.push("Some split members are not valid group members");
      }
    }
  }

  if (data.category !== undefined && !constants.EXPENSE_CATEGORIES.includes(data.category)) {
    errors.push(`Invalid category. Valid options: ${constants.EXPENSE_CATEGORIES.join(", ")}`);
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Validate group update
 * @param {object} data - Update data
 * @returns {object} Validation result
 */
function validateGroupUpdate(data) {
  const errors = [];

  if (data.name !== undefined) {
    if (typeof data.name !== "string") {
      errors.push("Group name must be a string");
    } else if (data.name.trim().length === 0) {
      errors.push("Group name cannot be empty");
    } else if (data.name.trim().length > constants.VALIDATION.GROUP_NAME_MAX) {
      errors.push(`Group name must be at most ${constants.VALIDATION.GROUP_NAME_MAX} characters`);
    }
  }

  return { valid: errors.length === 0, errors };
}

module.exports = {
  validateGroupCreation,
  validateMemberCreation,
  validateExpenseCreation,
  validateExpenseUpdate,
  validateGroupUpdate,
};
