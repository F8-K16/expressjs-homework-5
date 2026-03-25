import { UserStatus } from "../generated/prisma/enums";

export type User = {
  id: number;
  name: string;
  email: string;
  password: string;
  status: UserStatus;
};
