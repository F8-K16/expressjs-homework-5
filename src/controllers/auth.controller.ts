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
    const data = await authService.login(email, password);
    return res.json({
      data,
    });
  },
  async profile(req: Request, res: Response) {
    return res.json({
      message: "Lấy thông tin user thành công",
      data: req.user,
    });
  },
  async logout(req: Request, res: Response) {
    const { refreshToken } = req.body;

    await authService.logout(req.tokenJti!, req.tokenExp!, refreshToken);
    return res.json({
      message: "Đăng xuất thành công",
    });
  },
  logoutDevice: async (req: Request, res: Response) => {
    const { deviceId } = req.body;
    await authService.logoutDevice(deviceId, req.user!.id);
    return res.json({
      message: "Logout device thành công",
    });
  },
  logoutAllDeviceByUser: async (req: Request, res: Response) => {
    await authService.logoutAllDeviceByUser(req.user!.id);
    return res.json({});
  },
  async refreshToken(req: Request, res: Response) {
    const { refreshToken, deviceId } = req.body;
    const newToken = await authService.refreshToken(refreshToken, deviceId);

    return res.json({
      message: "Refresh token thành công",
      data: newToken,
    });
  },
  async loginHistories(req: Request, res: Response) {
    const histories = await authService.getLoginHistories(req.user!.id);
    return res.json({
      data: histories,
    });
  },
};
