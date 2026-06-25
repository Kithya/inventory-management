import type { NextFunction, Request, Response } from "express";
import { HttpError } from "./errors.js";
import { env } from "./env.js";
import { prisma } from "./prisma.js";
import { verifyAccessToken } from "./security.js";

function readBearerToken(req: Request) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) return null;
  return header.slice("Bearer ".length).trim();
}

export const requireAuth = async (
  req: Request,
  _res: Response,
  next: NextFunction,
) => {
  if (!env.AUTH_REQUIRED) {
    req.authPayload = {
      userId: "dev-local-admin",
      email: "dev@example.com",
      name: "Dev admin",
      role: "ADMIN",
      status: "ACTIVE",
    };
    return next();
  }

  const token = readBearerToken(req);
  if (!token) {
    return next(new HttpError(401, "Authentication is required.", "unauthorized"));
  }

  try {
    const payload = await verifyAccessToken(token);
    if (payload.status !== "ACTIVE") {
      return next(new HttpError(403, "Account is disabled.", "forbidden"));
    }

    const user = await prisma.user.findUnique({
      where: { userId: payload.userId },
      select: {
        userId: true,
        email: true,
        name: true,
        role: true,
        status: true,
      },
    });

    if (!user || user.status !== "ACTIVE") {
      return next(new HttpError(401, "Authentication is required.", "unauthorized"));
    }

    req.authPayload = user;
    return next();
  } catch {
    return next(new HttpError(401, "Authentication is required.", "unauthorized"));
  }
};

export const requireAdmin = (req: Request, _res: Response, next: NextFunction) => {
  const payload = req.authPayload;

  if (!payload) {
    return next(new HttpError(401, "Authentication is required.", "unauthorized"));
  }

  if (payload.role === "ADMIN") {
    return next();
  }

  return next(new HttpError(403, "Administrator access is required.", "forbidden"));
};
