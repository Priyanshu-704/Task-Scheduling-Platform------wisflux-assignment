import { Injectable } from '@nestjs/common';
import {
  Registry,
  Counter,
  Histogram,
  collectDefaultMetrics,
} from 'prom-client';

@Injectable()
export class MetricsService {
  public readonly registry: Registry;

  public readonly httpRequestsCounter: Counter<string>;
  public readonly httpRequestDurationHistogram: Histogram<string>;
  public readonly dbQueryDurationHistogram: Histogram<string>;
  public readonly redisDurationHistogram: Histogram<string>;
  public readonly queueJobsCounter: Counter<string>;

  constructor() {
    this.registry = new Registry();

    // Collect default system/process metrics (CPU, Memory, etc.)
    collectDefaultMetrics({ register: this.registry, prefix: 'nest_app_' });

    // HTTP Request Count Counter
    this.httpRequestsCounter = new Counter({
      name: 'nest_http_requests_total',
      help: 'Total number of HTTP requests processed',
      labelNames: ['method', 'route', 'status'],
      registers: [this.registry],
    });

    // HTTP Request Duration Histogram
    this.httpRequestDurationHistogram = new Histogram({
      name: 'nest_http_request_duration_seconds',
      help: 'HTTP request duration in seconds',
      labelNames: ['method', 'route', 'status'],
      buckets: [0.01, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
      registers: [this.registry],
    });

    // Database Latency Histogram
    this.dbQueryDurationHistogram = new Histogram({
      name: 'nest_db_query_duration_seconds',
      help: 'Database query duration in seconds',
      labelNames: ['operation', 'entity'],
      buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5],
      registers: [this.registry],
    });

    // Redis Query/Cache Latency Histogram
    this.redisDurationHistogram = new Histogram({
      name: 'nest_redis_op_duration_seconds',
      help: 'Redis operation duration in seconds',
      labelNames: ['operation', 'status'],
      buckets: [0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25],
      registers: [this.registry],
    });

    // Queue Job Count Counter
    this.queueJobsCounter = new Counter({
      name: 'nest_queue_jobs_total',
      help: 'Total number of BullMQ jobs processed',
      labelNames: ['queue', 'jobName', 'status'],
      registers: [this.registry],
    });
  }

  // Helpers to record metrics
  recordHttpRequest(
    method: string,
    route: string,
    status: string,
    durationSeconds: number,
  ) {
    this.httpRequestsCounter.inc({ method, route, status });
    this.httpRequestDurationHistogram.observe(
      { method, route, status },
      durationSeconds,
    );
  }

  recordDbQuery(operation: string, entity: string, durationSeconds: number) {
    this.dbQueryDurationHistogram.observe(
      { operation, entity },
      durationSeconds,
    );
  }

  recordRedisOp(operation: string, status: string, durationSeconds: number) {
    this.redisDurationHistogram.observe({ operation, status }, durationSeconds);
  }

  recordQueueJob(
    queue: string,
    jobName: string,
    status: 'completed' | 'failed',
  ) {
    this.queueJobsCounter.inc({ queue, jobName, status });
  }

  async getMetrics(): Promise<string> {
    return this.registry.metrics();
  }
}
