import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { PinoLogger } from 'nestjs-pino';
import path from 'path';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  constructor(private readonly logger: PinoLogger) {
    this.logger.setContext(HttpExceptionFilter.name);
  }

  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const message =
      exception instanceof HttpException
        ? exception.message
        : 'Internal server error';

    let errors: any = undefined;
    if (exception instanceof HttpException) {
      const exceptionResponse = exception.getResponse();
      if (
        typeof exceptionResponse === 'object' &&
        'message' in exceptionResponse
      ) {
        const msgs = (exceptionResponse as any).message;
        if (Array.isArray(msgs)) {
          errors = msgs;
        }
      }
    }

    if (status >= 500) {
      this.logger.error(
        { err: exception, path: request.url, statusCode: status },
        'Unhandled server error',
      );
    } else {
      this.logger.warn(
        { path: request.url, statusCode: status, message },
        'Handled client error',
      );
    }

    const errorResponse = {
      success: false,
      statusCode: status,
      message,
      ...(errors && { errors }),
      timestamp: new Date().toISOString(),
      path: request.url,
      ...(process.env.NODE_ENV !== 'production' &&
        exception instanceof Error && { stack: exception.stack }),
    };

    response.status(status).json(errorResponse);
  }
}
