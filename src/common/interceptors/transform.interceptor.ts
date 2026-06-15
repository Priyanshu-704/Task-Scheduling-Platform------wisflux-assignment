import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface Response<T> {
  success: boolean;
  statusCode: number;
  data: T;
  timestamp: string;
  correlationId: string;
}

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<
  T,
  Response<T> | T
> {
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<Response<T> | T> {
    const ctx = context.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    const correlationId = request.correlationId || '';
    const path = request.url;

    // Bypass wrapping for Swagger, Prom metrics, or Health check routes
    if (
      path === '/metrics' ||
      path === '/api/v1/metrics' ||
      path.includes('/health') ||
      path.includes('/docs')
    ) {
      return next.handle();
    }

    return next.handle().pipe(
      map((data) => {
        // If data is already wrapped or response is direct stream
        if (
          data &&
          typeof data === 'object' &&
          'success' in data &&
          'statusCode' in data
        ) {
          return data;
        }

        return {
          success: true,
          statusCode: response.statusCode,
          data: data === undefined ? null : data,
          timestamp: new Date().toISOString(),
          correlationId,
        };
      }),
    );
  }
}
