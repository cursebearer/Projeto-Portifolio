import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

interface ErrorResponseBody {
  statusCode: number;
  message: string | string[];
  error?: string;
  path: string;
  timestamp: string;
  stack?: string;
}

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const isHttp = exception instanceof HttpException;
    const status = isHttp
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;

    const httpBody = isHttp ? exception.getResponse() : null;
    const payloadMessage = this.extractMessage(httpBody, exception, status);
    const payloadError = this.extractError(httpBody, status);

    const body: ErrorResponseBody = {
      statusCode: status,
      message: payloadMessage,
      error: payloadError,
      path: request.url,
      timestamp: new Date().toISOString(),
    };

    const isProd = process.env.NODE_ENV === 'production';
    if (!isProd && exception instanceof Error) {
      body.stack = exception.stack;
    }

    if (status >= 500) {
      this.logger.error(
        `${request.method} ${request.url} → ${status}: ${
          exception instanceof Error ? exception.message : String(exception)
        }`,
        exception instanceof Error ? exception.stack : undefined,
      );
    }

    response.status(status).json(body);
  }

  private extractMessage(
    httpBody: unknown,
    exception: unknown,
    status: number,
  ): string | string[] {
    if (httpBody && typeof httpBody === 'object' && 'message' in httpBody) {
      const msg = (httpBody as { message: string | string[] }).message;
      if (msg) return msg;
    }
    if (typeof httpBody === 'string') {
      return httpBody;
    }
    if (status >= 500) {
      return 'Erro interno do servidor';
    }
    return exception instanceof Error ? exception.message : 'Erro';
  }

  private extractError(httpBody: unknown, status: number): string {
    if (httpBody && typeof httpBody === 'object' && 'error' in httpBody) {
      const err = (httpBody as { error?: string }).error;
      if (err) return err;
    }
    return HttpStatus[status] ?? 'Error';
  }
}
