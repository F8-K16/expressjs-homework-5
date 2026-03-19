import express from "express";
import { authController } from "../controllers/auth.controller";
import { validate } from "../middlewares/validate.middleware";
import { loginSchema, registerSchema } from "../schemas/auth.schema";
import { authMiddleware } from "../middlewares/auth.middleware";
const router = express.Router();

router.post("/register", validate(registerSchema), authController.register);
router.post("/login", validate(loginSchema), authController.login);
router.get("/me", authMiddleware, authController.profile);
router.delete("/logout", authMiddleware, authController.logout);
router.post("/refresh-token", authController.refreshToken);

export default router;
