const prisma = require("../../config/db");

// Calculate profit margin and check if usage should be blocked
const calculateProfitMargin = async (user, currentCost) => {
  if (!user.costTracking) {
    return { blocked: false };
  }

  const totalCost = user.costTracking.totalCostToOwner + currentCost;
  const costLimit = user.totalSpent * 0.5;

  if (totalCost > costLimit) {
    return {
      blocked: true,
      message: `User has reached 50% profit margin threshold. Total spent: $${user.totalSpent}, Current cost: $${totalCost.toFixed(2)}`,
    };
  }

  // Optional: Add warning before blocking
  const warningThreshold = costLimit * 0.8; // Warn at 80% of limit
  if (totalCost > warningThreshold) {
    return {
      blocked: false,
      warning: `User is approaching profit margin threshold (${((totalCost / costLimit) * 100).toFixed(1)}%)`,
    };
  }

  return { blocked: false };
};

module.exports = { calculateProfitMargin };