import { describe, expect, it } from "vitest";
import { hashPassword, validatePassword, verifyPassword } from "./security.js";

describe("password security", () => {
  it("enforces the password policy", () => {
    expect(validatePassword("short1")).toBe(false);
    expect(validatePassword("longpassword")).toBe(false);
    expect(validatePassword("1234567890")).toBe(false);
    expect(validatePassword("strongpass1")).toBe(true);
  });

  it("hashes and verifies passwords with Argon2id", async () => {
    const hash = await hashPassword("strongpass1");

    expect(hash).not.toBe("strongpass1");
    await expect(verifyPassword(hash, "strongpass1")).resolves.toBe(true);
    await expect(verifyPassword(hash, "wrongpass1")).resolves.toBe(false);
  });
});
