const asyncHandler = require("express-async-handler");
const bcrypt = require("bcryptjs");
const { prisma } = require("../config/db");
const { generateToken } = require("../config/jwt");
const { calculateProfitMargin } = require("../utils/profitcalculator");

// @desc    Register a new admin
// @route   POST /api/admin/register
// @access  Private/SuperAdmin (Add super admin middleware in routes)
const registerAdmin = asyncHandler(async (req, res) => {
  const { email, password, name } = req.body;

  // Validation
  if (!email || !password || !name) {
    res.status(400);
    throw new Error("Please include all fields (email, password, name)");
  }

  // Check existing admin
  const adminExists = await prisma.user.findUnique({ where: { email } });
  if (adminExists) {
    res.status(400);
    throw new Error("Admin already exists");
  }

  // Create admin
  const salt = await bcrypt.genSalt(10);
  const admin = await prisma.user.create({
    data: {
      email,
      name,
      password: await bcrypt.hash(password, salt),
      isAdmin: true,
      walletTokens: 1000000, // Initial admin token balance
    },
  });

  res.status(201).json({
    id: admin.id,
    email: admin.email,
    name: admin.name,
    isAdmin: true,
    token: generateToken(admin.id),
  });
});

// @desc    Authenticate admin
// @route   POST /api/admin/login
// @access  Public
const loginAdmin = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await prisma.user.findUnique({ where: { email } });

  // Verify admin status
  if (!user?.isAdmin) {
    res.status(401);
    throw new Error("Invalid admin credentials");
  }

  // Verify password
  if (!(await bcrypt.compare(password, user.password))) {
    res.status(401);
    throw new Error("Invalid credentials");
  }

  res.json({
    id: user.id,
    email: user.email,
    name: user.name,
    isAdmin: true,
    token: generateToken(user.id),
  });
});

// @desc    Get all users with enhanced profit analysis
// @route   GET /api/admin/users
// @access  Private/Admin
const getUsersWithUsage = asyncHandler(async (req, res) => {
  const users = await prisma.user.findMany({
    include: {
      costTracking: true,
      purchases: { orderBy: { createdAt: "desc" }, take: 3 },
      aiUsageLogs: {
        include: { model: true },
        orderBy: { createdAt: "desc" },
        take: 5,
      },
    },
  });

  const formattedUsers = users.map(user => {
    const profitData = calculateProfitMargin(user);
    
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      status: profitData.blocked ? "BLOCKED" : 
             profitData.warning ? "WARNING" : "ACTIVE",
      walletTokens: user.walletTokens.toString(),
      totalSpent: user.totalSpent,
      costToOwner: user.costTracking?.totalCostToOwner || 0,
      profitMargin: user.totalSpent > 0 
        ? 100 - ((user.costTracking?.totalCostToOwner || 0) / user.totalSpent * 100)
        : 0,
      lastPurchases: user.purchases.map(p => ({
        id: p.id,
        amount: p.tokenAmount.toString(),
        price: p.pricePaid,
        date: p.createdAt,
      })),
      recentActivities: user.aiUsageLogs.map(log => ({
        model: log.model.name,
        tokens: log.tokensUsed.toString(),
        cost: log.model.costPerUse,
        date: log.createdAt,
      })),
      ...profitData, // Includes warning/block messages if present
    };
  });

  res.json(formattedUsers);
});

module.exports = {
  registerAdmin,
  loginAdmin,
  getUsersWithUsage,
};