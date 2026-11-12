import { Router } from "express";
import { z } from "zod";
import { authService } from "./authService.js";
import { requireAuth } from "../../middleware/auth.middleware.js";

export const authRouter = Router();

const loginSchema = z.object({
  email: z.string().min(1, "Username or email is required"),
  password: z.string().min(1, "Password is required"),
});

authRouter.post("/login", async (req, res, next) => {
  try {
    const { email, password } = loginSchema.parse(req.body);
    const result = await authService.login({
      email,
      password,
      userAgent: req.headers["user-agent"],
      ipAddress: req.ip || "127.0.0.1",
    });

    res.json({
      status: "SUCCESS",
      ...result,
    });
  } catch (error: any) {
    if (error.message === "INVALID_CREDENTIALS") {
      res.status(401).json({
        error: "INVALID_CREDENTIALS",
        message: "Incorrect email address or password.",
      });
      return;
    }
    if (error.message === "ACCOUNT_INACTIVE") {
      res.status(403).json({
        error: "ACCOUNT_INACTIVE",
        message: "Your account is disabled or pending administrator activation.",
      });
      return;
    }
    next(error);
  }
});

authRouter.post("/logout", requireAuth, async (req, res, next) => {
  try {
    const token = req.headers.authorization?.substring(7) || "";
    await authService.logout(token, req.user?.id);
    res.json({ status: "SUCCESS", message: "Signed out successfully." });
  } catch (error) {
    next(error);
  }
});

authRouter.get("/me", requireAuth, async (req, res) => {
  res.json({
    status: "SUCCESS",
    user: req.user,
  });
});

authRouter.get("/sessions", requireAuth, async (req, res, next) => {
  try {
    if (!req.user) return;
    const sessions = await authService.getSessions(req.user.id, req.user.sessionId);
    res.json({ sessions });
  } catch (error) {
    next(error);
  }
});

authRouter.delete("/sessions/:id", requireAuth, async (req, res, next) => {
  try {
    if (!req.user) return;
    await authService.revokeSession(String(req.params.id), req.user.id);
    res.json({ status: "SUCCESS", message: "Session revoked." });
  } catch (error) {
    next(error);
  }
});

authRouter.post("/change-password", requireAuth, async (req, res, next) => {
  try {
    if (!req.user) return;
    const { currentPassword, newPassword } = req.body;
    await authService.changePassword(req.user.id, currentPassword, newPassword);
    res.json({ status: "SUCCESS", message: "Password updated successfully." });
  } catch (error: any) {
    if (error.message === "INVALID_CURRENT_PASSWORD") {
      res.status(400).json({ error: "INVALID_CURRENT_PASSWORD", message: "The current password entered is incorrect." });
      return;
    }
    if (error.message === "PASSWORD_TOO_WEAK") {
      res.status(400).json({ error: "PASSWORD_TOO_WEAK", message: "New password must be at least 8 characters long." });
      return;
    }
    next(error);
  }
});
