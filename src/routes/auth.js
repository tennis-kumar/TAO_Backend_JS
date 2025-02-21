import express from 'express';
import { handleGoogleAuth, handleGoogleCallback, getUserProfile } from '../controllers/authController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/google', handleGoogleAuth);
router.get('/google/callback', handleGoogleCallback);
router.get('/me', authMiddleware, getUserProfile);

export default router;