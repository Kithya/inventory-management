import type { ErrorRequestHandler, NextFunction, Request, Response } from "express";
import { ZodError } from "zod";

export class HttpError extends Error {
  statusCode: number;
  code: string;
  details?: unknown;

  constructor(statusCode: number, message: string, code = "request_error", details?: unknown) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

export const asyncHandler =
  <T extends Request>(
    handler: (req: T, res: Response, next: NextFunction) => Promise<void>,
  ) =>
  (req: T, res: Response, next: NextFunction) => {
    void handler(req, res, next).catch(next);
  };

export const notFoundHandler = (req: Request, _res: Response, next: NextFunction) => {
  next(new HttpError(404, `Route ${req.method} ${req.path} was not found.`, "not_found"));
};

export const errorHandler: ErrorRequestHandler = (error, req, res, _next) => {
  if (error instanceof ZodError) {
    return res.status(400).json({
      error: {
        code: "validation_error",
        message: "Request validation failed.",
        details: error.flatten(),
      },
      requestId: req.requestId,
    });
  }

  const statusCode =
    error instanceof HttpError
      ? error.statusCode
      : typeof error.status === "number"
        ? error.status
        : typeof error.statusCode === "number"
          ? error.statusCode
          : 500;

  const code =
    error instanceof HttpError
      ? error.code
      : statusCode === 401
        ? "unauthorized"
        : statusCode === 403
          ? "forbidden"
          : "internal_error";

  const message =
    statusCode >= 500
      ? "An unexpected server error occurred."
      : error instanceof Error
        ? error.message
        : "Request failed.";

  req.log?.error({ err: error, requestId: req.requestId }, message);

  return res.status(statusCode).json({
    error: {
      code,
      message,
      details: error instanceof HttpError ? error.details : undefined,
    },
    requestId: req.requestId,
  });
};
