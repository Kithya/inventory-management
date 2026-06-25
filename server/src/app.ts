import "dotenv/config";
import cookieParser from "cookie-parser";
import compression from "compression";
import cors from "cors";
import express from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import { pinoHttp } from "pino-http";
import swaggerUi from "swagger-ui-express";
import { randomUUID } from "crypto";
import type { IncomingMessage } from "http";
import authRoutes from "./routes/auth.route.js";
import dashboardRoutes from "./routes/dashboard.route.js";
import expenseRoutes from "./routes/expense.route.js";
import productRoutes from "./routes/product.route.js";
import userRoutes from "./routes/user.route.js";
import { requireAdmin, requireAuth } from "./lib/auth.js";
import { errorHandler, notFoundHandler } from "./lib/errors.js";
import { prisma } from "./lib/prisma.js";
import { env } from "./lib/env.js";
import { openApiSpec } from "./openapi.js";

export const app = express();

app.disable("x-powered-by");
app.set("trust proxy", 1);

app.use(
  pinoHttp({
    genReqId: (req: IncomingMessage) =>
      (req.headers["x-request-id"]?.toString() || randomUUID()).slice(0, 128),
    customProps: (req: IncomingMessage) => ({
      requestId: req.id,
    }),
  }),
);

app.use((req, _res, next) => {
  req.requestId = req.id?.toString() ?? randomUUID();
  next();
});

app.use(helmet());
app.use(compression());
app.use(
  cors({
    origin(origin, callback) {
      if (!origin || env.CLIENT_ORIGINS.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error("CORS origin is not allowed."));
    },
    credentials: true,
  }),
);
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: false, limit: "1mb" }));
app.use(cookieParser());
app.use(
  rateLimit({
    windowMs: 60_000,
    limit: 120,
    standardHeaders: "draft-8",
    legacyHeaders: false,
  }),
);

app.get("/healthz", (_req, res) => {
  res.json({ status: "ok" });
});

app.get("/readyz", async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: "ready" });
  } catch {
    res.status(503).json({ status: "not_ready" });
  }
});

app.get("/openapi.json", (_req, res) => {
  res.json(openApiSpec);
});
app.use("/docs", swaggerUi.serve, swaggerUi.setup(openApiSpec));

app.use("/auth", authRoutes);
app.use("/dashboard", requireAuth, dashboardRoutes);
app.use("/products", requireAuth, productRoutes);
app.use("/users", requireAuth, requireAdmin, userRoutes);
app.use("/expenses", requireAuth, expenseRoutes);

app.use(notFoundHandler);
app.use(errorHandler);
