import { OtpType } from "../generated/prisma/enums";
import { HttpException } from "../utils/exception";
import { generateOtp, hashOtp, verifyHashOtp } from "../utils/otpCode";
import { prisma } from "../utils/prisma";

export const otpService = {
  async createOtp({
    userId,
    type,
    ttlMinutes,
  }: {
    userId: number;
    type: OtpType;
    ttlMinutes: number;
  }) {
    const code = generateOtp();

    await prisma.otp.create({
      data: {
        userId,
        code: hashOtp(code),
        type,
        expiresAt: new Date(Date.now() + ttlMinutes * 60 * 1000),
      },
    });

    return code;
  },
  async verifyOtp({
    email,
    code,
    type,
  }: {
    email: string;
    code: string;
    type: OtpType;
  }) {
    const user = await prisma.user.findUnique({
      where: { email },
    });
    if (!user) throw new HttpException("Không tìm thấy email", 400);

    const otp = await prisma.otp.findFirst({
      where: {
        userId: user.id,
        type,
        usedAt: null,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: "desc" },
    });

    if (!otp) return null;
    const isValid = verifyHashOtp(code, otp.code);
    if (!isValid) return null;

    return { user, otp };
  },
};
