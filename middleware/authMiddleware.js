const { prisma } = require('../config/db');
const { verifyToken } = require('../config/jwt');
const { calculateProfitMargin } = require('../utils/calculateProfitMargin');

const protect = async (req, res, next) => {
  let token;
  
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = verifyToken(token);
      
      const user = await prisma.user.findUnique({
        where: { id: decoded.id },
        include: { costTracking: true }, // Required for profit calculation
      });

      if (!user) {
        res.status(401);
        throw new Error('User not found');
      }

      // Attach user and profit status to request
      req.user = {
        id: user.id,
        email: user.email,
        name: user.name,
        isAdmin: user.isAdmin,
        walletTokens: user.walletTokens,
        totalSpent: user.totalSpent
      };

      // Calculate profit margin for routes that need it
      req.profitStatus = calculateProfitMargin(user);
      
      next();
    } catch (error) {
      res.status(401).json({ 
        error: 'Not authorized',
        details: error.message 
      });
    }
  } else {
    res.status(401).json({ error: 'Not authorized, no token' });
  }
};

const admin = (req, res, next) => {
  if (req.user?.isAdmin) {
    next();
  } else {
    res.status(403).json({ error: 'Not authorized as admin' });
  }
};

const checkProfit = (req, res, next) => {
  if (req.profitStatus?.blocked) {
    return res.status(403).json({
      error: 'Service temporarily unavailable',
      details: req.profitStatus.message,
      metadata: {
        spent: req.user.totalSpent,
        cost: req.profitStatus.currentCost,
        margin: req.profitStatus.marginPercentage
      }
    });
  }
  next();
};

module.exports = { 
  protect,     // Standard JWT protection
  admin,       // Admin-only access
  checkProfit  // Optional profit check
};