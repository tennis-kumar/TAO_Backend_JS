import passport from "passport";
import AuthService from "../services/AuthService.js";
import { createError } from "../utils/errorUtils.js";

export const handleGoogleAuth = passport.authenticate("google", {
  scope: ["profile", "email"],
});

export const handleGoogleCallback = async (req, res, next) => {
  try {
    passport.authenticate("google", async (err, user) => {
      if (err) return next(err);
      if (!user) return next(createError("Authentication failed", 401));

      await AuthService.loginUser(req, user);
      
      const token = AuthService.generateAuthToken(user);
      const redirectUrl = AuthService.getAuthSuccessUrl(token);
      
      res.redirect(redirectUrl);
    })(req, res, next);
  } catch (error) {
    next(error);
  }
};

export const getUserProfile = (req, res) => {
  res.json({ user: req.user });
};
