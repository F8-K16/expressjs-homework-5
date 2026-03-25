import { UserStatus } from "../generated/prisma/enums";

declare module "express" {
  export interface Request {
    user?: {
      id: number;
      name: string;
      email: string;
      status: UserStatus;
      createdAt: Date | null;
      updatedAt: Date | null;
    };
    tokenJti?: string;
    tokenExp?: number;
  }
}
