import bcrypt from "bcrypt";

const SALT_ROUND = 10;
export const generateOtp = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

export const hashOtp = (otp: string) => {
  return bcrypt.hashSync(otp, SALT_ROUND);
};

export const verifyHashOtp = (plainOtp: string, otp: string) => {
  return bcrypt.compareSync(plainOtp, otp);
};
