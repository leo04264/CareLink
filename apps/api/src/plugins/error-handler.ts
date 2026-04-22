import type { FastifyInstance } from 'fastify';
import { ZodError } from 'zod';
import { DefaultHttpStatus, ErrorCodes, type ApiError, type ErrorCode } from '@carelink/shared';

/**
 * Thrown anywhere in the API; the error handler below turns it into a
 * typed ApiError envelope. The `code` drives the HTTP status via
 * DefaultHttpStatus unless `status` is explicitly overridden.
 */
export class ApiException extends Error {
  public readonly code: ErrorCode;
  public readonly status: number;
  public readonly details?: unknown;

  constructor(code: ErrorCode, message?: string, opts?: { status?: number; details?: unknown }) {
    super(message ?? code);
    this.code = code;
    this.status = opts?.status ?? DefaultHttpStatus[code];
    this.details = opts?.details;
  }
}

export function registerErrorHandler(app: FastifyInstance): void {
  app.setErrorHandler((err, req, reply) => {
    if (err instanceof ApiException) {
      const body: ApiError = { ok: false, error: { code: err.code, message: err.message, details: err.details } };
      return reply.status(err.status).send(body);
    }

    if (err instanceof ZodError) {
      const body: ApiError = {
        ok: false,
        error: { code: ErrorCodes.VALIDATION_ERROR, message: 'Validation failed', details: err.flatten() },
      };
      return reply.status(400).send(body);
    }

    // Fastify built-in validation (schema)
    if ((err as { validation?: unknown }).validation) {
      const body: ApiError = {
        ok: false,
        error: {
          code: ErrorCodes.VALIDATION_ERROR,
          message: err.message,
          details: (err as { validation?: unknown }).validation,
        },
      };
      return reply.status(400).send(body);
    }

    req.log.error({ err }, 'unhandled error');
    const body: ApiError = {
      ok: false,
      error: { code: ErrorCodes.INTERNAL_ERROR, message: 'Internal server error' },
    };
    return reply.status(500).send(body);
  });
}
