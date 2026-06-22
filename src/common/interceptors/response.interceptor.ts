import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Response } from '../interfaces/response.interface';
import { Response as ExpressResponse } from 'express';
@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, Response<T>> {
  intercept(
    context: ExecutionContext,
    next: CallHandler<T>,
  ): Observable<Response<T>> {
    const ctx = context.switchToHttp();
    const response = ctx.getResponse<ExpressResponse>();
    const statusCode = response.statusCode;

    return next.handle().pipe(
      map((responseData) => {
        if (responseData && typeof responseData === 'object') {
          const { message, data, meta } = responseData as any;

          return {
            success: true,
            statusCode,
            message: message || 'Request successful',
            data: data !== undefined ? data : responseData,
            ...(meta && { meta }),
            timestamp: new Date().toISOString(),
          };
        }
        return {
          success: true,
          statusCode,
          message: 'Request successful',
          data: responseData,
          timestamp: new Date().toISOString(),
        };
      }),
    );
  }
}
