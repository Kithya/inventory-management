import type { Request, Response } from "express";
import { z } from "zod";
import { UserRole } from "../../generated/prisma/client.js";
import { asyncHandler, HttpError } from "../lib/errors.js";
import { env } from "../lib/env.js";
import { prisma } from "../lib/prisma.js";
import {
  addDays,
  addMinutes,
  createAccessToken,
  createOpaqueToken,
  hashOpaqueToken,
  hashPassword,
  normalizeEmail,
  publicUser,
  validatePassword,
  verifyPassword,
} from "../lib/security.js";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const acceptInviteSchema = z.object({
  token: z.string().min(20),
  name: z.string().trim().min(1).max(120),
  password: z.string().min(10),
});

const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

const resetPasswordSchema = z.object({
  token: z.string().min(20),
  password: z.string().min(10),
});

const invalidLogin = new HttpError(
  401,
  "Invalid email or password.",
  "invalid_credentials",
);

function refreshCookieOptions() {
  return {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/auth",
    maxAge: env.REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000,
  };
}

function clearRefreshCookie(res: Response) {
  res.clearCookie(env.REFRESH_COOKIE_NAME, {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/auth",
  });
}

function readRefreshCookie(req: Request) {
  const value = req.cookies?.[env.REFRESH_COOKIE_NAME];
  if (typeof value !== "string") return null;
  const [sessionId, token] = value.split(".");
  if (!sessionId || !token) return null;
  return { sessionId, token, tokenHash: hashOpaqueToken(token) };
}

async function setRefreshCookie(req: Request, res: Response, userId: string) {
  const token = createOpaqueToken();
  const session = await prisma.refreshSession.create({
    data: {
      userId,
      tokenHash: hashOpaqueToken(token),
      expiresAt: addDays(new Date(), env.REFRESH_TOKEN_TTL_DAYS),
      userAgent: req.headers["user-agent"]?.slice(0, 512),
      ipAddress: req.ip,
    },
  });

  res.cookie(
    env.REFRESH_COOKIE_NAME,
    `${session.sessionId}.${token}`,
    refreshCookieOptions(),
  );

  return session;
}

async function authPayload(userId: string) {
  const user = await prisma.user.findUnique({
    where: { userId },
    select: {
      userId: true,
      email: true,
      name: true,
      role: true,
      status: true,
    },
  });

  if (!user || user.status !== "ACTIVE") {
    throw new HttpError(401, "Authentication is required.", "unauthorized");
  }

  return user;
}

async function respondWithSession(req: Request, res: Response, userId: string) {
  const user = await authPayload(userId);
  await setRefreshCookie(req, res, user.userId);
  const accessToken = await createAccessToken(user);

  res.json({
    accessToken,
    user: publicUser(user),
  });
}

export const login = asyncHandler(async (req: Request, res: Response) => {
  const body = loginSchema.parse(req.body);
  const email = normalizeEmail(body.email);
  const user = await prisma.user.findUnique({ where: { email } });

  if (
    !user ||
    user.status !== "ACTIVE" ||
    !user.passwordHash ||
    (user.lockedUntil && user.lockedUntil > new Date())
  ) {
    throw invalidLogin;
  }

  const isPasswordValid = await verifyPassword(user.passwordHash, body.password);

  if (!isPasswordValid) {
    const failedLoginCount = user.failedLoginCount + 1;
    await prisma.user.update({
      where: { userId: user.userId },
      data: {
        failedLoginCount,
        lockedUntil:
          failedLoginCount >= 5 ? addMinutes(new Date(), 15) : null,
      },
    });
    throw invalidLogin;
  }

  await prisma.user.update({
    where: { userId: user.userId },
    data: {
      failedLoginCount: 0,
      lockedUntil: null,
      lastLoginAt: new Date(),
    },
  });

  await respondWithSession(req, res, user.userId);
});

export const refresh = asyncHandler(async (req: Request, res: Response) => {
  const cookie = readRefreshCookie(req);
  if (!cookie) {
    clearRefreshCookie(res);
    throw new HttpError(401, "Authentication is required.", "unauthorized");
  }

  const session = await prisma.refreshSession.findUnique({
    where: { sessionId: cookie.sessionId },
  });

  if (
    !session ||
    session.tokenHash !== cookie.tokenHash ||
    session.expiresAt <= new Date()
  ) {
    clearRefreshCookie(res);
    throw new HttpError(401, "Authentication is required.", "unauthorized");
  }

  if (session.revokedAt) {
    await prisma.refreshSession.updateMany({
      where: { userId: session.userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    clearRefreshCookie(res);
    throw new HttpError(401, "Authentication is required.", "unauthorized");
  }

  const nextSession = await setRefreshCookie(req, res, session.userId);
  await prisma.refreshSession.update({
    where: { sessionId: session.sessionId },
    data: {
      revokedAt: new Date(),
      replacedBySessionId: nextSession.sessionId,
    },
  });

  const user = await authPayload(session.userId);
  const accessToken = await createAccessToken(user);

  res.json({
    accessToken,
    user: publicUser(user),
  });
});

export const logout = asyncHandler(async (req: Request, res: Response) => {
  const cookie = readRefreshCookie(req);
  if (cookie) {
    await prisma.refreshSession.updateMany({
      where: {
        sessionId: cookie.sessionId,
        tokenHash: cookie.tokenHash,
        revokedAt: null,
      },
      data: { revokedAt: new Date() },
    });
  }

  clearRefreshCookie(res);
  res.json({ ok: true });
});

export const me = asyncHandler(async (req: Request, res: Response) => {
  if (!req.authPayload) {
    throw new HttpError(401, "Authentication is required.", "unauthorized");
  }

  res.json({ user: publicUser(req.authPayload) });
});

export const acceptInvite = asyncHandler(async (req: Request, res: Response) => {
  const body = acceptInviteSchema.parse(req.body);

  if (!validatePassword(body.password)) {
    throw new HttpError(
      400,
      "Password must be at least 10 characters and include a letter and a number.",
      "weak_password",
    );
  }

  const invite = await prisma.inviteToken.findUnique({
    where: { tokenHash: hashOpaqueToken(body.token) },
  });

  if (
    !invite ||
    invite.acceptedAt ||
    invite.revokedAt ||
    invite.expiresAt <= new Date()
  ) {
    throw new HttpError(400, "Invite link is invalid or expired.", "invalid_invite");
  }

  const email = normalizeEmail(invite.email);
  const passwordHash = await hashPassword(body.password);

  const user = await prisma.$transaction(async (tx) => {
    const existing = await tx.user.findUnique({ where: { email } });

    if (existing?.passwordHash) {
      throw new HttpError(400, "Invite link is invalid or expired.", "invalid_invite");
    }

    const nextUser = existing
      ? await tx.user.update({
          where: { userId: existing.userId },
          data: {
            name: body.name,
            passwordHash,
            authProvider: "local",
            authSubject: `local:${existing.userId}`,
            role: invite.role,
            status: "ACTIVE",
            emailVerifiedAt: new Date(),
          },
        })
      : await tx.user.create({
          data: {
            name: body.name,
            email,
            passwordHash,
            authProvider: "local",
            authSubject: `pending:${invite.inviteId}`,
            role: invite.role,
            status: "ACTIVE",
            emailVerifiedAt: new Date(),
          },
        });

    const authSubject =
      nextUser.authSubject.startsWith("local:")
        ? nextUser.authSubject
        : `local:${nextUser.userId}`;

    const finalizedUser =
      nextUser.authSubject === authSubject
        ? nextUser
        : await tx.user.update({
            where: { userId: nextUser.userId },
            data: { authSubject },
          });

    await tx.inviteToken.update({
      where: { inviteId: invite.inviteId },
      data: {
        acceptedAt: new Date(),
        acceptedById: finalizedUser.userId,
      },
    });

    return finalizedUser;
  });

  await respondWithSession(req, res, user.userId);
});

export const forgotPassword = asyncHandler(async (req: Request, res: Response) => {
  const body = forgotPasswordSchema.parse(req.body);
  const email = normalizeEmail(body.email);
  const user = await prisma.user.findUnique({ where: { email } });
  let resetLink: string | undefined;

  if (user?.passwordHash && user.status === "ACTIVE") {
    const token = createOpaqueToken();
    await prisma.authToken.create({
      data: {
        userId: user.userId,
        purpose: "PASSWORD_RESET",
        tokenHash: hashOpaqueToken(token),
        expiresAt: addMinutes(new Date(), env.RESET_TOKEN_TTL_MINUTES),
      },
    });
    resetLink = `${env.APP_URL}/reset-password?token=${token}`;
    req.log?.info({ resetLink, email }, "Password reset link generated");
  }

  res.json({
    ok: true,
    message: "If the account exists, a reset link has been generated.",
    resetLink: env.NODE_ENV === "production" ? undefined : resetLink,
  });
});

export const resetPassword = asyncHandler(async (req: Request, res: Response) => {
  const body = resetPasswordSchema.parse(req.body);

  if (!validatePassword(body.password)) {
    throw new HttpError(
      400,
      "Password must be at least 10 characters and include a letter and a number.",
      "weak_password",
    );
  }

  const authToken = await prisma.authToken.findUnique({
    where: { tokenHash: hashOpaqueToken(body.token) },
  });

  if (
    !authToken ||
    authToken.purpose !== "PASSWORD_RESET" ||
    authToken.usedAt ||
    authToken.expiresAt <= new Date()
  ) {
    throw new HttpError(400, "Reset link is invalid or expired.", "invalid_reset");
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { userId: authToken.userId },
      data: {
        passwordHash: await hashPassword(body.password),
        failedLoginCount: 0,
        lockedUntil: null,
      },
    }),
    prisma.authToken.update({
      where: { authTokenId: authToken.authTokenId },
      data: { usedAt: new Date() },
    }),
    prisma.refreshSession.updateMany({
      where: { userId: authToken.userId, revokedAt: null },
      data: { revokedAt: new Date() },
    }),
  ]);

  res.json({ ok: true });
});

export function inviteLink(token: string) {
  return `${env.APP_URL}/accept-invite?token=${token}`;
}

export { UserRole };
