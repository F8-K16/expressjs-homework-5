import { JwtPayload } from "jsonwebtoken";
import { User } from "../types/user.type";
import { verifyPassword } from "../utils/hashing";
import {
  createAccessToken,
  createRefreshToken,
  decodeToken,
  verifyAccessToken,
  verifyRefreshToken,
} from "../utils/jwt";
import { userService } from "./user.service";
import { redisClient } from "../utils/redis";
import { HttpException } from "../utils/exception";
import { prisma } from "../utils/prisma";

export const authService = {
  async register(userData: User) {
    const user = await userService.create(userData);
    return user;
  },
  async login(email: string, password: string) {
    const user = await userService.findByEmail(email);

    if (!user || !verifyPassword(password, user.password)) {
      throw new HttpException("Email hoặc mật khẩu không chính xác", 401);
    }

    const deviceId = Math.random().toString(36).substring(2, 15);

    const accessToken = createAccessToken({ id: user.id, deviceId });
    const refreshToken = createRefreshToken({ id: user.id, deviceId });

    //Lưu lịch sử đăng nhập vào database
    await prisma.loginHistory.create({
      data: {
        userId: user.id,
        ipAddress: "1.2.3.4",
        userAgent: "Chrome",
        deviceId,
      },
    });

    const payloadRefresh = decodeToken(refreshToken) as JwtPayload;

    const { jti: jtiAccessToken, exp: expAccessToken } = decodeToken(
      accessToken,
    ) as JwtPayload & { jti: string };

    // Lưu thiết bị vào redis
    await redisClient.setEx(
      `device_${user.id}_${deviceId}`,
      Math.floor(expAccessToken! - Date.now() / 1000),
      JSON.stringify({
        jtiAccessToken,
        expAccessToken,
        jtiRefreshToken: payloadRefresh.jti,
      }),
    );

    // Lưu refresh token
    await redisClient.setEx(
      `refreshToken:${payloadRefresh.jti}`,
      payloadRefresh.exp! - Math.floor(Date.now() / 1000),
      user.id.toString(),
    );

    return { accessToken, refreshToken, deviceId };
  },
  async profile(token: string) {
    const decoded = verifyAccessToken(token) as JwtPayload & { id: number };
    if (!decoded) {
      throw new HttpException("Token không hợp lệ", 400);
    }

    if (await this.verifyBlacklist(decoded.jti!)) {
      throw new HttpException("Token không hợp lệ", 400);
    }

    const user = await userService.findById(decoded.id);
    return { user, decoded };
  },

  async logout(jti: string, exp: number, refreshToken: string) {
    // xóa access token (blacklist)
    redisClient.setEx(
      `blacklist:${jti}`,
      Math.floor(exp - Date.now() / 1000),
      "access",
    );

    const decoded = verifyRefreshToken(refreshToken) as JwtPayload & {
      id: number;
    };
    if (!decoded) throw new HttpException("Refresh token không hợp lệ", 400);
    const refreshTokenExisted = await redisClient.exists(
      `refreshToken:${decoded.jti}`,
    );
    if (!refreshTokenExisted)
      throw new HttpException("Refresh token không hợp lệ", 400);

    // xóa refresh token
    redisClient.del(`refreshToken:${decoded.jti}`);

    return true;
  },

  async logoutDevice(deviceId: string, userId: number) {
    const key = `device_${userId}_${deviceId}`;
    const deviceFromRedis = await redisClient.get(key);
    if (!deviceFromRedis) {
      return;
    }
    const { jtiAccessToken, expAccessToken, jtiRefreshToken } =
      JSON.parse(deviceFromRedis);

    // Xóa access token (blacklist)
    const seconds = Math.floor(expAccessToken - Date.now() / 1000);
    redisClient.setEx(`blacklist:${jtiAccessToken}`, seconds, jtiAccessToken);

    // Xóa refresh token
    await redisClient.del(`refreshToken:${jtiRefreshToken}`);

    //Xóa device khỏi redis
    redisClient.del(key);
  },

  async logoutAllDeviceByUser(userId: number) {
    const keys = await redisClient.keys(`device_${userId}_*`);
    for (const key of keys) {
      const deviceFromRedis = await redisClient.get(key);
      if (!deviceFromRedis) {
        continue;
      }
      const { jtiAccessToken, expAccessToken, jtiRefreshToken } =
        JSON.parse(deviceFromRedis);
      const seconds = Math.floor(expAccessToken - Date.now() / 1000);
      redisClient.setEx(`blacklist:${jtiAccessToken}`, seconds, jtiAccessToken);
      await redisClient.del(`refreshToken:${jtiRefreshToken}`);
      redisClient.del(key);
    }
  },

  async verifyBlacklist(jti: string) {
    const blacklist = await redisClient.get(`blacklist:${jti}`);
    return blacklist;
  },
  async refreshToken(refreshToken: string, deviceId: string) {
    const decoded = verifyRefreshToken(refreshToken) as JwtPayload & {
      id: number;
    };
    if (!decoded) throw new HttpException("Refresh token không hợp lệ", 400);

    const { jti, id } = decoded;

    const refreshTokenExisted = await redisClient.exists(`refreshToken:${jti}`);
    if (!refreshTokenExisted)
      throw new HttpException("Refresh token không hợp lệ", 400);

    const newAccessToken = createAccessToken({ id, deviceId });
    const newRefreshToken = createRefreshToken({ id, deviceId });
    const newDecoded = decodeToken(newRefreshToken) as JwtPayload;

    await redisClient.setEx(
      `refreshToken:${newDecoded.jti}`,
      newDecoded.exp! - Math.floor(Date.now() / 1000),
      id.toString(),
    );

    await redisClient.del(`refreshToken:${jti}`);

    return {
      newAccessToken,
      newRefreshToken,
    };
  },
  async getLoginHistories(userId: number) {
    const histories = await prisma.loginHistory.findMany({
      where: {
        userId,
      },
    });
    return histories;
  },
};
