const asyncHandler = require('express-async-handler');
const { prisma } = require('../config/db');
const { calculateProfitMargin } = require('../utils/profitcalculator');


// @desc    Purchase tokens
// @route   POST /api/tokens/purchase
// @access  Private
const purchaseTokens = asyncHandler(async (req, res) => {
  const { tokenAmount, pricePaid } = req.body;
  const userId = req.user.id;

  // Convert to BigInt
  const tokenAmountBigInt = BigInt(tokenAmount);

  await prisma.$transaction([
    prisma.user.update({
      where: { id: userId },
      data: {
        walletTokens: { increment: tokenAmountBigInt },
        totalSpent: { increment: parseFloat(pricePaid) },
      },
    }),
    prisma.purchase.create({
      data: {
        tokenAmount: tokenAmountBigInt,
        pricePaid: parseFloat(pricePaid),
        userId,
      },
    }),
  ]);

  const updatedUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { walletTokens: true, totalSpent: true },
  });

  res.status(201).json({
    walletTokens: updatedUser.walletTokens.toString(),
    totalSpent: updatedUser.totalSpent,
  });
});

// @desc    Use AI feature
// @route   POST /api/tokens/use-ai
// @access  Private
const useAIFeature = asyncHandler(async (req, res) => {
  const { modelName } = req.body;
  const userId = req.user.id;

  // Get model cost
  const model = await prisma.model.findUnique({
    where: { name: modelName },
  });

  if (!model) {
    res.status(404);
    throw new Error('Model not found');
  }

  return await prisma.$transaction(async (prisma) => {
    // Get user with locking
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { costTracking: true },
      select: {
        walletTokens: true,
        totalSpent: true,
        costTracking: true
      }
    });

    // Check token balance
    if (user.walletTokens < model.tokenCost) {
      res.status(403);
      throw new Error('Insufficient tokens');
    }

    // Profit protection check using utility
    const profitCheck = calculateProfitMargin(user, model.costPerUse);
    if (profitCheck.blocked) {
      res.status(403).json({
        error: profitCheck.message,
        details: {
          spent: user.totalSpent,
          cost: profitCheck.currentCost,
          margin: profitCheck.marginPercentage
        }
      });
      return;
    }

    // Deduct tokens
    await prisma.user.update({
      where: { id: userId },
      data: { walletTokens: { decrement: model.tokenCost } },
    });
    
    // Log usage
    await prisma.aiUsageLog.create({
      data: {
        tokensUsed: model.tokenCost,
        userId,
        modelName,
      },
    });
    
    // Update cost tracking
    await prisma.costTracking.upsert({
      where: { userId },
      update: {
        totalTokensUsed: { increment: model.tokenCost },
        totalCostToOwner: { increment: model.costPerUse },
      },
      create: {
        totalTokensUsed: model.tokenCost,
        totalCostToOwner: model.costPerUse,
        userId,
      },
    });

    const response = {
      success: true,
      tokensDeducted: model.tokenCost.toString(),
    };

    // Add warning if approaching limit
    if (profitCheck.warning) {
      response.warning = profitCheck.warning;
    }

    res.status(200).json(response);
  });
});

module.exports = {
  purchaseTokens,
  useAIFeature
};