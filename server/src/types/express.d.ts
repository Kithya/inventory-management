import type pino from "pino";
import type { UserRole, UserStatus } from "../../generated/prisma/client.js";

type RequestAuthPayload = {
  userId: string;
  email: string;
  name: string;
  role: UserRole;
  status: UserStatus;
};

declare global {
  namespace Express {
    interface Request {
      requestId: string;
      authPayload?: RequestAuthPayload;
      log?: pino.Logger;
    }
  }
}

export {};
