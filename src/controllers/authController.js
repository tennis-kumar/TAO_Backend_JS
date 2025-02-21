import passport from 'passport';
import { generateToken } from '../utils/tokenUtils.js';
import { createError } from '../utils/errorUtils.js';

export const handleGoogleAuth = (req, res, next) => {
  passport.authenticate('google', { 
    scope: ['profile', 'email'] 
  })(req, res, next);
};

export const handleGoogleCallback = (req, res, next) => {
  passport.authenticate('google', { failureRedirect: process.env.VITE_UI_URL }, async (err, user, info) => {
    try {
      if (err) throw err;
      if (!user) throw createError('Authentication failed', 401);

      await new Promise((resolve, reject) => {
        req.logIn(user, (err) => err ? reject(err) : resolve());
      });

      const token = generateToken(user);
      const redirectUrl = new URL('/auth-success', process.env.VITE_UI_URL);
      redirectUrl.searchParams.set('token', token);
      
      res.redirect(redirectUrl.toString());
    } catch (error) {
      next(error);
    }
  })(req, res, next);
};

export const getUserProfile = (req, res) => {
  res.json({ user: req.user });
};