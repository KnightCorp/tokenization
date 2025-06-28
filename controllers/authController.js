const asyncHandler = require('express-async-handler');
const bcrypt = require('bcryptjs');
const { prisma } = require('../config/db');
const { generateToken } = require('../config/jwt');

// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = asyncHandler(async (req, res) => {
  const { email, password, name } = req.body;

  if (!email || !password) {
    res.status(400);
    throw new Error('Please add all fields');
  }

  const userExists = await prisma.user.findUnique({ where: { email } });
  if (userExists) {
    res.status(400);
    throw new Error('User already exists');
  }

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  const user = await prisma.user.create({
    data: {
      email,
      name,
      password: hashedPassword,
    },
  });

  if (user) {
    res.status(201).json({
      id: user.id,
      email: user.email,
      name: user.name,
      token: generateToken(user.id),
    });
  } else {
    res.status(400);
    throw new Error('Invalid user data');
  }
});

// @desc    Authenticate user
// @route   POST /api/auth/login
// @access  Public
const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await prisma.user.findUnique({ where: { email } });

  if (user && (await bcrypt.compare(password, user.password))) {
    res.json({
      id: user.id,
      email: user.email,
      name: user.name,
      isAdmin: user.isAdmin,
      token: generateToken(user.id),
    });
  } else {
    res.status(400);
    throw new Error('Invalid credentials');
  }
});

module.exports = {
  registerUser,
  loginUser
};