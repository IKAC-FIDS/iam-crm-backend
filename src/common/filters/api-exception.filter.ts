import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import { ApiErrorResponse } from '../http/api-response.types';

type NestErrorResponse =
  | string
  | {
      statusCode?: number;
      message?: string | string[];
      error?: string;
      code?: string;
      details?: unknown;
    };

function getResponseRequestId(response: Response, request: Request): string | null {
  const responseHeader = response.getHeader('x-request-id');

  if (Array.isArray(responseHeader)) {
    return String(responseHeader[0] ?? '').trim() || null;
  }

  if (responseHeader !== undefined) {
    return String(responseHeader).trim() || null;
  }

  const requestHeader = request.headers['x-request-id'];

  if (Array.isArray(requestHeader)) {
    return requestHeader[0]?.trim() || null;
  }

  return requestHeader?.trim() || null;
}

function normalizeMessage(message: unknown): string {
  if (Array.isArray(message)) {
    return message.join('; ');
  }

  if (typeof message === 'string' && message.trim()) {
    return message;
  }

  return 'Unexpected error';
}

function normalizeDetails(message: unknown, explicitDetails?: unknown): unknown {
  if (explicitDetails !== undefined) {
    return explicitDetails;
  }

  if (Array.isArray(message)) {
    return message;
  }

  return undefined;
}

function httpStatusToCode(statusCode: number): string {
  switch (statusCode) {
    case HttpStatus.BAD_REQUEST:
      return 'BAD_REQUEST';
    case HttpStatus.UNAUTHORIZED:
      return 'UNAUTHORIZED';
    case HttpStatus.FORBIDDEN:
      return 'FORBIDDEN';
    case HttpStatus.NOT_FOUND:
      return 'NOT_FOUND';
    case HttpStatus.CONFLICT:
      return 'CONFLICT';
    case HttpStatus.GONE:
      return 'GONE';
    case HttpStatus.TOO_MANY_REQUESTS:
      return 'RATE_LIMITED';
    case HttpStatus.UNPROCESSABLE_ENTITY:
      return 'UNPROCESSABLE_ENTITY';
    default:
      return statusCode >= 500 ? 'INTERNAL_SERVER_ERROR' : 'HTTP_ERROR';
  }
}

@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();

    const normalized = this.normalizeException(exception);

    const body: ApiErrorResponse = {
      success: false,
      error: {
        code: normalized.code,
        message: normalized.message,
        ...(normalized.details !== undefined && { details: normalized.details }),
      },
      requestId: getResponseRequestId(response, request),
      timestamp: new Date().toISOString(),
      path: request.originalUrl || request.url,
      method: request.method,
      statusCode: normalized.statusCode,
    };

    response.status(normalized.statusCode).json(body);
  }

  private normalizeException(exception: unknown): {
    statusCode: number;
    code: string;
    message: string;
    details?: unknown;
  } {
    if (exception instanceof HttpException) {
      const statusCode = exception.getStatus();
      const exceptionResponse = exception.getResponse() as NestErrorResponse;

      if (typeof exceptionResponse === 'string') {
        return {
          statusCode,
          code: httpStatusToCode(statusCode),
          message: exceptionResponse,
        };
      }

      const message = exceptionResponse.message ?? exception.message;

      const isValidationError =
        statusCode === HttpStatus.BAD_REQUEST &&
        Array.isArray(exceptionResponse.message);

      return {
        statusCode,
        code:
          exceptionResponse.code ??
          (isValidationError ? 'VALIDATION_ERROR' : httpStatusToCode(statusCode)),
        message: isValidationError
          ? 'Validation failed'
          : normalizeMessage(message),
        details: normalizeDetails(message, exceptionResponse.details),
      };
    }

    if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      return this.normalizePrismaKnownError(exception);
    }

    if (exception instanceof Prisma.PrismaClientValidationError) {
      return {
        statusCode: HttpStatus.BAD_REQUEST,
        code: 'PRISMA_VALIDATION_ERROR',
        message: 'Database validation error',
      };
    }

    return {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Internal server error',
    };
  }

  private normalizePrismaKnownError(
    exception: Prisma.PrismaClientKnownRequestError,
  ): {
    statusCode: number;
    code: string;
    message: string;
    details?: unknown;
  } {
    switch (exception.code) {
      case 'P2002':
        return {
          statusCode: HttpStatus.CONFLICT,
          code: 'UNIQUE_CONSTRAINT_FAILED',
          message: 'Unique constraint failed',
          details: exception.meta,
        };

      case 'P2003':
        return {
          statusCode: HttpStatus.BAD_REQUEST,
          code: 'FOREIGN_KEY_CONSTRAINT_FAILED',
          message: 'Invalid relation reference',
          details: exception.meta,
        };

      case 'P2025':
        return {
          statusCode: HttpStatus.NOT_FOUND,
          code: 'RECORD_NOT_FOUND',
          message: 'Record not found',
          details: exception.meta,
        };

      default:
        return {
          statusCode: HttpStatus.BAD_REQUEST,
          code: `PRISMA_${exception.code}`,
          message: 'Database request error',
          details: exception.meta,
        };
    }
  }
}