import type { ErrorRequestHandler, RequestHandler } from "express";
import { isProduction } from "../env.js";

export class AppError extends Error {
  readonly statusCode: number;
  readonly code: string;

  constructor(statusCode: number, code: string, message: string) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
  }
}

export const notFoundHandler: RequestHandler = (req, _res, next) => {
  next(new AppError(404, "ROUTE_NOT_FOUND", `Route not found: ${req.method} ${req.path}`));
};

export const errorHandler: ErrorRequestHandler = (error, req, res, _next) => {
  const statusCode = error instanceof AppError ? error.statusCode : 500;
  const code = error instanceof AppError ? error.code : "INTERNAL_SERVER_ERROR";
  const message = statusCode === 500 && isProduction
    ? "Unexpected server error."
    : error instanceof Error
      ? error.message
      : "Unexpected server error.";

  if (statusCode >= 500) {
    console.error({
      requestId: req.requestId,
      path: req.path,
      method: req.method,
      error,
    });
  }

  res.status(statusCode).json({
    error: {
      code,
      message,
      requestId: req.requestId,
    },
  });
};
