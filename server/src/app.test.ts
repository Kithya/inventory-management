import request from "supertest";
import { describe, expect, it } from "vitest";
import { app } from "./app.js";

describe("health checks", () => {
  it("returns liveness status", async () => {
    const response = await request(app).get("/healthz");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: "ok" });
  });
});

describe("auth routes", () => {
  it("allows logout without an active session", async () => {
    const response = await request(app).post("/auth/logout");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ ok: true });
  });
});
