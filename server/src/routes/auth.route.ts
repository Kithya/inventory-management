import { Router } from "express";
import rateLimit from "express-rate-limit";
import {
  acceptInvite,
  forgotPassword,
  login,
  logout,
  me,
  refresh,
  resetPassword,
} from "../controllers/auth.controller.js";
import { requireAuth } from "../lib/auth.js";

const router = Router();

const authLimiter = rateLimit({
  windowMs: 60_000,
  limit: 10,
  standardHeaders: "draft-8",
  legacyHeaders: false,
});

router.post("/login", authLimiter, login);
router.post("/refresh", refresh);
router.post("/logout", logout);
router.get("/me", requireAuth, me);
router.post("/accept-invite", authLimiter, acceptInvite);
router.post("/forgot-password", authLimiter, forgotPassword);
router.post("/reset-password", authLimiter, resetPassword);

export default router;
