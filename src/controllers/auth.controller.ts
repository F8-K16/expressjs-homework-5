import { Request, Response } from "express";
import { authService } from "../services/auth.service";

export const authController = {
  async register(req: Request, res: Response) {
    const user = await authService.register(req.body);
    return res.json({
      message: "Đăng ký tài khoản thành công",
      data: user,
    });
  },
  async login(req: Request, res: Response) {
    const { email, password } = req.body;
    try {
      const result = await authService.login(email, password);
      return res.json({
        data: result,
      });
    } catch {
      return res.status(401).json({
        message: "Email hoặc mật khẩu không chính xác",
      });
    }
  },
  async profile(req: Request, res: Response) {
    return res.json({
      message: "Lấy thông tin user thành công",
      data: req.user,
    });
  },
  async logout(req: Request, res: Response) {
    const { refresh_token } = req.body;
    await authService.logout(req.tokenJti!, req.tokenExp!, refresh_token);
    return res.json({
      message: "Đăng xuất thành công",
    });
  },
  async refreshToken(req: Request, res: Response) {
    console.log(req.body);

    const { refresh_token } = req.body;

    try {
      const result = await authService.refreshToken(refresh_token);
      return res.json(result);
    } catch {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }
  },
};
