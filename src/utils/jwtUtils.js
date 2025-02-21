import jwt from 'jsonwebtoken';
import { createError } from "./errorUtils.js";

export const generateToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      email: user.email,
      name: user.name
    },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );
};

export const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    throw createError("Invalid or expired token", 401);
  }
};

export const extractToken = (authHeader) => {
  if (!authHeader) throw createError("No token provided", 401);

  const token = authHeader.split(" ")[1];
  if (!token) throw createError("Invalid token format", 401);

  return token;
};