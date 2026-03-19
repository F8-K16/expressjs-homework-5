import jsonwebtoken, { JwtPayload } from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET as string;
const JWT_ACCESS_EXPIRED = process.env.JWT_ACCESS_EXPIRED as unknown as number;
const JWT_REFRESH_EXPIRED = process.env
  .JWT_REFRESH_EXPIRED as unknown as number;

export const createAccessToken = (payload: JwtPayload) => {
  return jsonwebtoken.sign(
    { ...payload, jti: crypto.randomUUID() },
    JWT_SECRET,
    {
      expiresIn: JWT_ACCESS_EXPIRED,
    },
  );
};

export const createRefreshToken = (payload: JwtPayload) => {
  return jsonwebtoken.sign(
    { ...payload, jti: crypto.randomUUID() },
    JWT_SECRET,
    { expiresIn: JWT_REFRESH_EXPIRED },
  );
};

export const verifyToken = (token: string) => {
  try {
    const decoded = jsonwebtoken.verify(token, JWT_SECRET);
    return decoded;
  } catch {
    return false;
  }
};
