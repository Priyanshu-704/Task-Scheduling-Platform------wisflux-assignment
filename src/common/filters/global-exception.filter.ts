import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger('ExceptionFilter');

  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const exceptionResponse: any =
      exception instanceof HttpException
        ? exception.getResponse()
        : { message: 'Internal server error' };

    const correlationId = (request as any).correlationId || uuidv4();
    const message =
      typeof exceptionResponse === 'object' && exceptionResponse.message
        ? exceptionResponse.message
        : exception.message || exceptionResponse;

    const errorName =
      typeof exceptionResponse === 'object' && exceptionResponse.error
        ? exceptionResponse.error
        : exception.name || 'InternalServerError';

    const errorResponseBody = {
      success: false,
      statusCode: status,
      message: Array.isArray(message) ? message.join(', ') : message,
      error: errorName,
      timestamp: new Date().toISOString(),
      path: request.url,
      correlationId,
    };

    // Log the error
    this.logger.error(
      `[${correlationId}] ${request.method} ${request.url} - Status: ${status} - Error: ${JSON.stringify(errorResponseBody)}`,
      exception.stack,
    );

    response.status(status).json(errorResponseBody);
  }
}
