import jwt from 'jsonwebtoken';
import { createError } from '../utils/errorUtils.js';

export const verifyToken = (token, secret) => {
  try {
    return jwt.verify(token, secret);
  } catch (error) {
    throw createError('Invalid token', 401);
  }
};

export const extractToken = (authHeader) => {
  if (!authHeader) {
    throw createError('No token provided', 401);
  }
  const token = authHeader.split(' ')[1];
  if (!token) {
    throw createError('Invalid token format', 401);
  }
  return token;
};

export const authMiddleware = (req, res, next) => {
  try {
    const token = extractToken(req.header('Authorization'));
    const decoded = verifyToken(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(error.statusCode || 401).json({ message: error.message });
  }
};