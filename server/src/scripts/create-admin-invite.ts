import "dotenv/config";
import { prisma } from "../lib/prisma.js";
import {
  addDays,
  createOpaqueToken,
  hashOpaqueToken,
  normalizeEmail,
} from "../lib/security.js";
import { env } from "../lib/env.js";

function usableValue(value: string | undefined) {
  if (!value || value === "true" || value === "false") return undefined;
  return value;
}

function readArg(name: string) {
  const exactIndex = process.argv.indexOf(`--${name}`);
  if (exactIndex !== -1) return usableValue(process.argv[exactIndex + 1]);

  const inlinePrefix = `--${name}=`;
  const inlineValue = process.argv.find((arg) => arg.startsWith(inlinePrefix));
  if (inlineValue) return usableValue(inlineValue.slice(inlinePrefix.length));

  return usableValue(process.env[`npm_config_${name}`]);
}

function readPositionalArgs() {
  return process.argv.slice(2).filter((arg, index, args) => {
    if (arg.startsWith("--")) return false;
    return !args[index - 1]?.startsWith("--");
  });
}

async function main() {
  const positionalArgs = readPositionalArgs();
  const emailArg = readArg("email") ?? positionalArgs[0];
  const positionalName = positionalArgs.slice(1).join(" ") || undefined;
  const nameArg = readArg("name") ?? positionalName;

  if (!emailArg) {
    throw new Error(
      'Missing required email. Examples: npm run auth:create-admin -- owner@example.com "Owner" OR npm run auth:create-admin -- --email owner@example.com --name "Owner"',
    );
  }

  const existingAdmin = await prisma.user.findFirst({
    where: {
      role: "ADMIN",
      passwordHash: { not: null },
      status: "ACTIVE",
    },
  });

  if (existingAdmin) {
    throw new Error(
      `An active admin already exists (${existingAdmin.email}). Create future admins from the Users page.`,
    );
  }

  const email = normalizeEmail(emailArg);
  const token = createOpaqueToken();

  await prisma.inviteToken.updateMany({
    where: {
      email,
      role: "ADMIN",
      acceptedAt: null,
      revokedAt: null,
      expiresAt: { gt: new Date() },
    },
    data: { revokedAt: new Date() },
  });

  await prisma.inviteToken.create({
    data: {
      email,
      name: nameArg,
      role: "ADMIN",
      tokenHash: hashOpaqueToken(token),
      expiresAt: addDays(new Date(), env.INVITE_TOKEN_TTL_DAYS),
    },
  });

  console.log("Admin invite created.");
  console.log(`${env.APP_URL}/accept-invite?token=${token}`);
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
