import express from "express";
import { authController } from "../controllers/auth.controller";
import { validate } from "../middlewares/validate.middleware";
import {
  loginSchema,
  refreshTokenSchema,
  registerSchema,
} from "../schemas/auth.schema";
import { authMiddleware } from "../middlewares/auth.middleware";
const router = express.Router();

router.post("/register", validate(registerSchema), authController.register);
router.post("/verify-email", authController.verifyEmail);
router.post("/resend-verification", authController.resendVerification);
router.post("/forgot-password", authController.forgotPassword);
router.post("/reset-password", authController.resetPassword);
router.post("/resend-reset-otp", authController.resendResetVerification);

router.post("/login", validate(loginSchema), authController.login);
router.get("/me", authMiddleware, authController.profile);
router.delete("/logout", authMiddleware, authController.logout);
router.post(
  "/refresh-token",
  validate(refreshTokenSchema),
  authController.refreshToken,
);
router.get("/me/histories", authMiddleware, authController.loginHistories);
router.delete("/logout-device", authMiddleware, authController.logoutDevice);
router.delete(
  "/logout-devices",
  authMiddleware,
  authController.logoutAllDeviceByUser,
);

export default router;
