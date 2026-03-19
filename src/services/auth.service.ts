import { JwtPayload } from "jsonwebtoken";
import { User } from "../types/user.type";
import { verifyPassword } from "../utils/hashing";
import {
  createAccessToken,
  createRefreshToken,
  verifyToken,
} from "../utils/jwt";
import { userService } from "./user.service";
import { redisClient } from "../utils/redis";

export const authService = {
  async register(userData: User) {
    const user = await userService.create(userData);
    return user;
  },
  async login(email: string, password: string) {
    const user = await userService.findByEmail(email);
    if (!user) {
      throw new Error("USER_NOT_FOUND");
    }

    if (!verifyPassword(password, user.password)) {
      throw new Error("PASSWORD_WRONG");
    }

    const accessToken = createAccessToken({ id: user.id });
    const refreshToken = createRefreshToken({ id: user.id });

    const decoded = verifyToken(refreshToken) as JwtPayload;
    await (
      await redisClient
    ).setEx(
      `refresh:${decoded.jti}`,
      decoded.exp! - Math.floor(Date.now() / 1000),
      user.id.toString(),
    );

    return { access_token: accessToken, refresh_token: refreshToken };
  },
  async profile(token: string) {
    const decoded = verifyToken(token) as JwtPayload & { id: number };
    if (!decoded) {
      throw new Error("INVALID_TOKEN");
    }

    if (await this.verifyBlacklist(decoded.jti!)) {
      throw new Error("TOKEN_BLACKLIST");
    }

    const user = await userService.findById(decoded.id);
    return { user, decoded };
  },
  async logout(jti: string, exp: number, refreshToken: string) {
    const accessTtl = Math.floor(exp - Date.now() / 1000);
    if (accessTtl > 0) {
      await (await redisClient).setEx(`blacklist:${jti}`, accessTtl, "access");
    }

    if (refreshToken) {
      const decoded = verifyToken(refreshToken) as JwtPayload;
      if (decoded) {
        const refreshTtl = Math.floor(decoded.exp! - Date.now() / 1000);
        if (refreshTtl > 0) {
          await (
            await redisClient
          ).setEx(`blacklist:${decoded.jti}`, refreshTtl, "refresh");
        }
        await (await redisClient).del(`refresh:${decoded.jti}`);
      }
    }
    return true;
  },
  async verifyBlacklist(jti: string) {
    const blacklist = await (await redisClient).get(`blacklist:${jti}`);
    return blacklist;
  },
  async refreshToken(refreshToken: string) {
    const decoded = verifyToken(refreshToken) as JwtPayload & { id: number };
    if (!decoded) throw new Error("INVALID_TOKEN");

    const { jti, exp, id } = decoded;

    const exists = await (await redisClient).get(`refresh:${jti}`);
    if (!exists) throw new Error("NOT_FOUND");

    if (await this.verifyBlacklist(jti!)) {
      throw new Error("TOKEN_BLACKLIST");
    }

    const newAccessToken = createAccessToken({ id });
    const newRefreshToken = createRefreshToken({ id });
    const newDecode = verifyToken(newRefreshToken) as JwtPayload;

    await (
      await redisClient
    ).setEx(
      `refresh:${newDecode.jti}`,
      newDecode.exp! - Math.floor(Date.now() / 1000),
      id.toString(),
    );

    await (
      await redisClient
    ).setEx(
      `blacklist:${jti}`,
      exp! - Math.floor(Date.now() / 1000),
      "refresh",
    );

    await (await redisClient).del(`refresh:${jti}`);

    return {
      access_token: newAccessToken,
      refresh_token: newRefreshToken,
    };
  },
};
