import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { MetricsService } from './metrics.service';

@Injectable()
export class MetricsInterceptor implements NestInterceptor {
  constructor(private readonly metricsService: MetricsService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const http = context.switchToHttp();
    const request = http.getRequest();
    if (!request) {
      // Non-HTTP context (e.g. WebSocket or BullMQ)
      return next.handle();
    }

    const { method, route } = request;
    // Fallback to url path if route path is not defined yet
    const routePath = route ? route.path : request.url;
    const startTime = process.hrtime();

    return next.handle().pipe(
      tap({
        next: () => {
          const response = http.getResponse();
          const status = response?.statusCode
            ? response.statusCode.toString()
            : '200';
          const elapsed = this.getElapsedSeconds(startTime);
          this.metricsService.recordHttpRequest(
            method,
            routePath,
            status,
            elapsed,
          );
        },
        error: (err) => {
          const status = err.status ? err.status.toString() : '500';
          const elapsed = this.getElapsedSeconds(startTime);
          this.metricsService.recordHttpRequest(
            method,
            routePath,
            status,
            elapsed,
          );
        },
      }),
    );
  }

  private getElapsedSeconds(startTime: [number, number]): number {
    const diff = process.hrtime(startTime);
    return diff[0] + diff[1] / 1e9;
  }
}
