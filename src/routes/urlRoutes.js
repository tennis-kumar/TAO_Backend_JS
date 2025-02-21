import express from "express";
import {authMiddleware} from "../middleware/authMiddleware.js";
import { 
    deleteUrl, 
    getUrlsByUser, 
    redirectUrl, 
    shortenUrl, 
    updateUrl 
} from "../controllers/urlController.js";
import { getOverallAnalytics, getUrlAnalytics, getTopicAnalytics } from "../controllers/analyticsController.js";
import rateLimiter from "../middleware/ratelimitter.js";

const router = express.Router();

router.post("/shorten",authMiddleware, rateLimiter, shortenUrl);
router.get("/shorten/:alias", redirectUrl);
router.patch("/shorten/:alias", authMiddleware, updateUrl );
router.delete("/shorten/:alias", authMiddleware, deleteUrl);

router.get("/user/urls", authMiddleware, getUrlsByUser);

router.get("/analytics/overall", authMiddleware, getOverallAnalytics);
router.get("/analytics/url/:alias", authMiddleware,getUrlAnalytics);
router.get("/analytics/topic/:topic", authMiddleware, getTopicAnalytics);

export default router;