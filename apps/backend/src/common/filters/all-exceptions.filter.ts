import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request, Response } from 'express';
import {
  DomainError,
  Extension,
  ConflictError,
  ForbiddenError,
  NotFoundError,
  TooManyRequestsError,
  UnauthorizedError,
  ValidationError,
} from '../errors/domain.error';
import { AppConfig } from '../../config';

export interface ErrorResponseBody {
  statusCode: number;
  error: string;
  message: string | string[];
  code?: string;
  extensions?: Extension[];
  path: string;
  timestamp: string;
}
type DomainErrorClass = abstract new (...args: never[]) => DomainError;

const DOMAIN_ERROR_MAP: ReadonlyArray<{
  type: DomainErrorClass;
  status: HttpStatus;
  error: string;
}> = [
  { type: NotFoundError, status: HttpStatus.NOT_FOUND, error: 'Not Found' },
  {
    type: ValidationError,
    status: HttpStatus.BAD_REQUEST,
    error: 'Bad Request',
  },
  { type: ForbiddenError, status: HttpStatus.FORBIDDEN, error: 'Forbidden' },
  {
    type: UnauthorizedError,
    status: HttpStatus.UNAUTHORIZED,
    error: 'Unauthorized',
  },
  { type: ConflictError, status: HttpStatus.CONFLICT, error: 'Conflict' },
  {
    type: TooManyRequestsError,
    status: HttpStatus.TOO_MANY_REQUESTS,
    error: 'Too Many Requests',
  },
];

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger('ExceptionFilter');

  constructor(private readonly config: ConfigService) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();
    const req = ctx.getRequest<Request>();

    let status: HttpStatus = HttpStatus.INTERNAL_SERVER_ERROR;
    let error: string = 'Internal Server Error';
    let message: string | string[] = 'Internal Server Error';
    let code: string | undefined;
    let extensions: Extension[] | undefined;

    if (exception instanceof DomainError) {
      const mapped = DOMAIN_ERROR_MAP.find((m) => exception instanceof m.type);
      status = mapped?.status ?? HttpStatus.INTERNAL_SERVER_ERROR;
      error = mapped?.error ?? 'Internal Server Error';
      message = exception.message;
      code = exception.code;
      if (exception.extensions.length) extensions = exception.extensions;
    } else if (exception instanceof HttpException) {
      status = exception.getStatus();
      const body = exception.getResponse();
      if (typeof body === 'string') {
        message = body;
        error = exception.name;
      } else {
        const b = body as { message?: string | string[]; error?: string };
        message = b.message ?? exception.message;
        error = b.error ?? exception.name;
      }
    } else {
      const app = this.config.getOrThrow<AppConfig>('app');
      if (app.sendInternalServerErrorDetails && exception instanceof Error) {
        message = exception.message;
      }
    }
    const logPayload = JSON.stringify({
      statusCode: status,
      code,
      method: req.method,
      path: req.path,
    });
    if (status >= HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error(
        logPayload,
        exception instanceof Error ? exception.stack : undefined,
      );
    } else {
      this.logger.warn(logPayload);
    }
    const responseBody: ErrorResponseBody = {
      statusCode: status,
      error,
      message,
      ...(code ? { code } : {}),
      ...(extensions ? { extensions } : {}),
      path: req.path,
      timestamp: new Date().toISOString(),
    };
    res.status(status).send(responseBody);
  }
}
