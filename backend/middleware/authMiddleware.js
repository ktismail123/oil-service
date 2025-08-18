const path = require('path');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');

// Load .env based on ENVIRONMENT
try {
  const envFile = `.env.${process.env.ENVIRONMENT || 'development'}`;
  require('dotenv').config({ path: envFile });
} catch (err) {
  console.error('Failed to load env file:', err);
}

const SECRET_KEY = process.env.SECRET_KEY;

module.exports = (req, res, next) => {

  if(req.path == '/api/auth/login'){
    return next();
  }

  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ message: 'Invalid token' });
  }
};
