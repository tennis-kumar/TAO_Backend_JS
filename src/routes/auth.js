import e from "express";
import passport from "passport";
import jwt from "jsonwebtoken";

const router = e.Router();

router.get("/google",passport.authenticate("google", { scope: ["profile", "email"] }));

// Google Callback Route
router.get("/google/callback", (req, res, next) => {
    passport.authenticate("google", { failureRedirect: "/" }, (err, user, info) => {
      if (err) return next(err);
      if (!user) return res.status(401).json({ message: "Authentication failed" });
  
      req.logIn(user, (err) => {
        if (err) return next(err);
  
        // Generate JWT Token
        const token = jwt.sign(
          { id: user._id, googleId: user.googleId, email: user.email, name: user.name },
          process.env.JWT_SECRET,
          { expiresIn: "1h" }
        );
  
        // Redirect user to frontend with the token
        res.redirect(`http://localhost:5173/auth-success?token=${token}`);
      });
    })(req, res, next);
  });

router.get("/me", (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ message: "Authentication failed, Token not found" });

    const token = authHeader.split(" ")[1];

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log(decoded);
        const response = {
          user: {...decoded}
        }
        console.log(response);
        return res.json(response);
        
        
    } catch (error) {
        return res.status(401).json({ message: "Authentication failed, Invalid token" });
    }
});

export default router;