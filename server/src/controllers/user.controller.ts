import type { Request, Response } from "express";
import { z } from "zod";
import { Prisma } from "../../generated/prisma/client.js";
import { pageQuerySchema, pagination, serializeUser } from "../lib/api.js";
import { asyncHandler, HttpError } from "../lib/errors.js";
import { prisma } from "../lib/prisma.js";
import {
  addDays,
  createOpaqueToken,
  hashOpaqueToken,
  normalizeEmail,
} from "../lib/security.js";
import { env } from "../lib/env.js";

const userQuerySchema = pageQuerySchema.extend({
  search: z.string().trim().default(""),
});

const createInviteSchema = z.object({
  email: z.string().email(),
  name: z.string().trim().max(120).optional(),
  role: z.enum(["ADMIN", "USER"]).default("USER"),
});

export const getUser = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const query = userQuerySchema.parse(req.query);
    const where: Prisma.UserWhereInput = query.search
      ? {
          OR: [
            { name: { contains: query.search, mode: Prisma.QueryMode.insensitive } },
            { email: { contains: query.search, mode: Prisma.QueryMode.insensitive } },
          ],
        }
      : {};

    const [total, users] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        orderBy: {
          name: "asc",
        },
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
    ]);

    res.json({
      data: users.map(serializeUser),
      pagination: pagination(query.page, query.pageSize, total),
    });
  },
);

function serializeInvite(invite: {
  inviteId: string;
  email: string;
  name: string | null;
  role: "ADMIN" | "USER";
  expiresAt: Date;
  acceptedAt: Date | null;
  revokedAt: Date | null;
  createdAt: Date;
  createdBy?: { name: string; email: string } | null;
  acceptedBy?: { name: string; email: string } | null;
}) {
  const now = new Date();
  const status = invite.revokedAt
    ? "REVOKED"
    : invite.acceptedAt
      ? "ACCEPTED"
      : invite.expiresAt <= now
        ? "EXPIRED"
        : "PENDING";

  return {
    inviteId: invite.inviteId,
    email: invite.email,
    name: invite.name,
    role: invite.role,
    status,
    expiresAt: invite.expiresAt.toISOString(),
    acceptedAt: invite.acceptedAt?.toISOString() ?? null,
    revokedAt: invite.revokedAt?.toISOString() ?? null,
    createdAt: invite.createdAt.toISOString(),
    createdBy: invite.createdBy ?? null,
    acceptedBy: invite.acceptedBy ?? null,
  };
}

export const getInvites = asyncHandler(
  async (_req: Request, res: Response): Promise<void> => {
    const invites = await prisma.inviteToken.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
      include: {
        createdBy: { select: { name: true, email: true } },
        acceptedBy: { select: { name: true, email: true } },
      },
    });

    res.json({
      data: invites.map(serializeInvite),
    });
  },
);

export const createInvite = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const body = createInviteSchema.parse(req.body);
    const email = normalizeEmail(body.email);

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser?.passwordHash) {
      throw new HttpError(409, "This user already has an active account.", "user_exists");
    }

    await prisma.inviteToken.updateMany({
      where: {
        email,
        acceptedAt: null,
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
      data: { revokedAt: new Date() },
    });

    const token = createOpaqueToken();
    const invite = await prisma.inviteToken.create({
      data: {
        email,
        name: body.name,
        role: body.role,
        tokenHash: hashOpaqueToken(token),
        expiresAt: addDays(new Date(), env.INVITE_TOKEN_TTL_DAYS),
        createdById: req.authPayload?.userId,
      },
      include: {
        createdBy: { select: { name: true, email: true } },
        acceptedBy: { select: { name: true, email: true } },
      },
    });

    res.status(201).json({
      invite: serializeInvite(invite),
      inviteLink: `${env.APP_URL}/accept-invite?token=${token}`,
    });
  },
);

export const revokeInvite = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const params = z.object({ inviteId: z.string().uuid() }).parse(req.params);

    const result = await prisma.inviteToken.updateMany({
      where: {
        inviteId: params.inviteId,
        acceptedAt: null,
        revokedAt: null,
      },
      data: { revokedAt: new Date() },
    });

    if (result.count === 0) {
      throw new HttpError(404, "Invite was not found or cannot be revoked.", "invite_not_found");
    }

    res.json({ ok: true });
  },
);
