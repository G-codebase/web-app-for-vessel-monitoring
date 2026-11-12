import { Router } from "express";
import { z } from "zod";
import { userService } from "./userService.js";
import { requireAuth, requirePermission } from "../../middleware/auth.middleware.js";

export const userRouter = Router();

userRouter.use(requireAuth);

userRouter.get("/", requirePermission("user.read"), async (_req, res, next) => {
  try {
    const users = await userService.listUsers();
    res.json({ users });
  } catch (error) {
    next(error);
  }
});

const capitalUsernameRegex = /^[A-Z0-9_]+$/;

const createUserSchema = z.object({
  email: z.string().email().optional(),
  mailId: z.string().email().optional(),
  username: z
    .string()
    .min(2, 'Username must be at least 2 characters')
    .max(32, 'Username cannot exceed 32 characters')
    .regex(capitalUsernameRegex, 'User Name must consist of CAPITAL characters only (A-Z, 0-9, _)')
    .optional(),
  userName: z
    .string()
    .min(2, 'Username must be at least 2 characters')
    .max(32, 'Username cannot exceed 32 characters')
    .regex(capitalUsernameRegex, 'User Name must consist of CAPITAL characters only (A-Z, 0-9, _)')
    .optional(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  roleName: z.enum(["SUPER_ADMIN", "ADMIN", "TESTER_ADMIN", "OPERATOR", "VIEWER"]).default("OPERATOR"),
  vesselIds: z.array(z.string()).optional(),
  password: z.string().min(6).optional(),
  temporaryPassword: z.string().min(6).optional(),
}).refine(data => data.email || data.mailId, {
  message: "Either email or mailId is required",
  path: ["email"],
});

userRouter.post("/", requirePermission("user.create"), async (req, res, next) => {
  try {
    const body = createUserSchema.parse(req.body);
    const actor = {
      id: req.user!.id,
      name: `${req.user!.firstName} ${req.user!.lastName}`,
      role: req.user!.roles[0] || "ADMIN",
    };

    const user = await userService.createUser(actor, body);
    res.status(201).json({ status: "SUCCESS", user });
  } catch (error: any) {
    if (error.message === "USER_ALREADY_EXISTS") {
      res.status(409).json({
        error: "USER_ALREADY_EXISTS",
        message: "An account with this email address already exists.",
      });
      return;
    }
    if (error.message === "USERNAME_MUST_BE_CAPITAL") {
      res.status(400).json({
        error: "USERNAME_MUST_BE_CAPITAL",
        message: "User Name must consist of CAPITAL characters only (A-Z, 0-9, _).",
      });
      return;
    }
    if (error.message === "USERNAME_TAKEN") {
      res.status(409).json({
        error: "USERNAME_TAKEN",
        message: "This username is already taken. Please choose another username.",
      });
      return;
    }
    if (error.message === "PASSWORD_TOO_SHORT") {
      res.status(400).json({
        error: "PASSWORD_TOO_SHORT",
        message: "Password must be at least 6 characters.",
      });
      return;
    }
    if (error.name === "ZodError") {
      res.status(400).json({
        error: "VALIDATION_ERROR",
        message: error.errors[0]?.message || "Invalid input data",
      });
      return;
    }
    next(error);
  }
});

userRouter.patch("/:id/status", requirePermission("user.disable"), async (req, res, next) => {
  try {
    const { status } = req.body;
    if (status !== "ACTIVE" && status !== "DISABLED") {
      res.status(400).json({ error: "INVALID_STATUS", message: "Status must be ACTIVE or DISABLED" });
      return;
    }

    const actor = {
      id: req.user!.id,
      name: `${req.user!.firstName} ${req.user!.lastName}`,
      role: req.user!.roles[0] || "ADMIN",
    };

    const user = await userService.updateUserStatus(actor, String(req.params.id), status);
    res.json({ status: "SUCCESS", user: { id: user.id, email: user.email, status: user.status } });
  } catch (error) {
    next(error);
  }
});
