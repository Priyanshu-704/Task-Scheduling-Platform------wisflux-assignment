import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

@Injectable()
export class FilesService {
  private readonly s3Client: S3Client;
  private readonly bucketName: string;
  private readonly logger = new Logger(FilesService.name);

  constructor(private readonly configService: ConfigService) {
    const endpoint =
      this.configService.get<string>('s3.endpoint') || 'http://localhost:9000';
    const region = this.configService.get<string>('s3.region') || 'us-east-1';
    const accessKeyId =
      this.configService.get<string>('s3.accessKey') || 'minioadmin';
    const secretAccessKey =
      this.configService.get<string>('s3.secretKey') || 'minioadmin';
    this.bucketName =
      this.configService.get<string>('s3.bucket') || 'task-attachments';

    this.s3Client = new S3Client({
      region,
      endpoint,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
      forcePathStyle: true, // Required for local MinIO / LocalStack setup
    });
  }

  async getUploadPresignedUrl(
    key: string,
    contentType: string,
    expiresInSeconds = 3600,
  ): Promise<string> {
    try {
      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        ContentType: contentType,
      });
      return await getSignedUrl(this.s3Client, command, {
        expiresIn: expiresInSeconds,
      });
    } catch (error) {
      this.logger.error(
        `Error generating upload presigned URL for key ${key}:`,
        error,
      );
      throw error;
    }
  }

  async getDownloadPresignedUrl(
    key: string,
    expiresInSeconds = 3600,
  ): Promise<string> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });
      return await getSignedUrl(this.s3Client, command, {
        expiresIn: expiresInSeconds,
      });
    } catch (error) {
      this.logger.error(
        `Error generating download presigned URL for key ${key}:`,
        error,
      );
      throw error;
    }
  }
}
