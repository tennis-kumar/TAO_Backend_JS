import { extractToken, verifyToken } from '../utils/jwtUtils.js';


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