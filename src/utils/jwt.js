// ========================================
// JWT UTILITIES
// src/utils/jwt.js
// ========================================
const jwt = require('jsonwebtoken');

const generateTokens = (payload) => {
  const accessToken = jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d',
  });

  const refreshToken = jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRE || '30d',
  });

  return { accessToken, refreshToken };
};

const verifyToken = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET);
};

module.exports = {
  generateTokens,
  verifyToken,
};
