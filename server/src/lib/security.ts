import { createHash, randomBytes } from "crypto";
import argon2 from "argon2";
import { jwtVerify, SignJWT } from "jose";
import type { UserRole, UserStatus } from "../../generated/prisma/client.js";
import { env } from "./env.js";

const accessSecret = new TextEncoder().encode(env.JWT_ACCESS_SECRET);

export type AuthUser = {
  userId: string;
  email: string;
  name: string;
  role: UserRole;
  status: UserStatus;
};

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export function hashOpaqueToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function createOpaqueToken() {
  return randomBytes(32).toString("base64url");
}

export async function hashPassword(password: string) {
  return argon2.hash(password, {
    type: argon2.argon2id,
    memoryCost: 19456,
    timeCost: 2,
    parallelism: 1,
  });
}

export async function verifyPassword(hash: string, password: string) {
  return argon2.verify(hash, password);
}

export function validatePassword(password: string) {
  return (
    password.length >= 10 &&
    /[A-Za-z]/.test(password) &&
    /\d/.test(password)
  );
}

export async function createAccessToken(user: AuthUser) {
  return new SignJWT({
    email: user.email,
    name: user.name,
    role: user.role,
    status: user.status,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(user.userId)
    .setIssuedAt()
    .setExpirationTime(`${env.ACCESS_TOKEN_TTL_MINUTES}m`)
    .sign(accessSecret);
}

export async function verifyAccessToken(token: string) {
  const { payload } = await jwtVerify(token, accessSecret);

  if (
    typeof payload.sub !== "string" ||
    typeof payload.email !== "string" ||
    typeof payload.name !== "string" ||
    (payload.role !== "ADMIN" && payload.role !== "USER") ||
    (payload.status !== "ACTIVE" && payload.status !== "DISABLED")
  ) {
    throw new Error("Invalid access token payload.");
  }

  return {
    userId: payload.sub,
    email: payload.email,
    name: payload.name,
    role: payload.role,
    status: payload.status,
  };
}

export function addDays(date: Date, days: number) {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
}

export function addMinutes(date: Date, minutes: number) {
  return new Date(date.getTime() + minutes * 60 * 1000);
}

export function publicUser(user: AuthUser) {
  return {
    userId: user.userId,
    email: user.email,
    name: user.name,
    role: user.role,
    status: user.status,
  };
}
