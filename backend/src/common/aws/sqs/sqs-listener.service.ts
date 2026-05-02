import { GetObjectCommand } from '@aws-sdk/client-s3';
import {
  DeleteMessageCommand,
  Message,
  ReceiveMessageCommand,
} from '@aws-sdk/client-sqs';
import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import mammoth from 'mammoth';
import { PDFParse } from 'pdf-parse';
import { DocumentsService } from '../../../modules/documents/documents.service';
import { DocumentStatus } from '../../../modules/documents/entities/document-status.enum';
import { SseService } from '../../../modules/sse/sse.service';
import { OpenSearchService } from '../opensearch/opensearch.service';
import { S3Service } from '../s3/s3.service';
import type { DocumentIndexSource, S3EventEnvelope } from '../types';
import { SqsService } from './sqs.service';

@Injectable()
export class SqsListenerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(SqsListenerService.name);
  private readonly queueUrl: string;
  private readonly enabled: boolean;
  private readonly pollIntervalMs: number;
  private readonly s3Bucket: string;
  private readonly openSearchIndex: string;
  private timer: NodeJS.Timeout | null = null;
  private isPolling = false;

  constructor(
    private readonly s3Service: S3Service,
    private readonly sqsService: SqsService,
    private readonly openSearchService: OpenSearchService,
    private readonly configService: ConfigService,
    private readonly documentsService: DocumentsService,
    private readonly sseService: SseService,
  ) {
    this.queueUrl = this.configService.getOrThrow<string>(
      'config.aws.sqsQueueUrl',
    );
    this.enabled = this.configService.get<boolean>(
      'config.aws.sqsListenerEnabled',
      false,
    );
    this.pollIntervalMs = this.configService.get<number>(
      'config.aws.sqsPollIntervalMs',
      5000,
    );
    this.s3Bucket = this.configService.getOrThrow<string>(
      'config.aws.s3Bucket',
    );
    this.openSearchIndex = this.configService.getOrThrow<string>(
      'config.aws.opensearchIndex',
    );
  }

  onModuleInit() {
    if (!this.enabled) {
      this.logger.log('SQS listener is disabled');
      return;
    }

    this.logger.log('Starting SQS listener');
    this.timer = setInterval(() => {
      void this.pollMessages();
    }, this.pollIntervalMs);
  }

  onModuleDestroy() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  private async pollMessages() {
    if (this.isPolling) return;
    this.isPolling = true;

    try {
      const result = await this.sqsService.client.send(
        new ReceiveMessageCommand({
          QueueUrl: this.queueUrl,
          MaxNumberOfMessages: 3,
          WaitTimeSeconds: 20,
          VisibilityTimeout: 60,
        }),
      );

      const messages = result.Messages ?? [];
      if (!messages.length) return;

      this.logger.log(`Received ${messages.length} message(s) from SQS`);

      for (const message of messages) {
        await this.handleMessage(message);
      }
    } catch (error) {
      this.logger.error(
        'SQS polling failed',
        error instanceof Error ? error.stack : '',
      );
    } finally {
      this.isPolling = false;
    }
  }

  private async handleMessage(message: Message) {
    try {
      const s3Key = this.extractS3ObjectKey(message.Body ?? '');

      if (!s3Key) {
        this.logger.warn(
          `Message ${message.MessageId ?? 'unknown'} has no S3 key, skipping`,
        );
      } else {
        await this.processS3UploadEvent(s3Key);
      }

      if (message.ReceiptHandle) {
        await this.sqsService.client.send(
          new DeleteMessageCommand({
            QueueUrl: this.queueUrl,
            ReceiptHandle: message.ReceiptHandle,
          }),
        );
      }
    } catch (error) {
      this.logger.error(
        `Failed to handle SQS message ${message.MessageId ?? 'unknown'}`,
        error instanceof Error ? error.stack : '',
      );
    }
  }

  private extractS3ObjectKey(body: string): string | null {
    if (!body) return null;

    const parsed = this.safeJsonParse<S3EventEnvelope>(body);
    const directKey = parsed?.Records?.[0]?.s3?.object?.key;
    if (directKey) {
      return decodeURIComponent(directKey).replace(/\+/g, ' ');
    }

    const nestedBody = parsed?.Message;
    if (nestedBody) {
      const nested = this.safeJsonParse<S3EventEnvelope>(nestedBody);
      const nestedKey = nested?.Records?.[0]?.s3?.object?.key;
      if (nestedKey) {
        return decodeURIComponent(nestedKey).replace(/\+/g, ' ');
      }
    }

    return null;
  }

  private safeJsonParse<T>(value: string): T | null {
    try {
      return JSON.parse(value) as T;
    } catch {
      return null;
    }
  }

  private async processS3UploadEvent(s3Key: string) {
    const document = await this.documentsService.findByS3Filename(s3Key);
    if (!document) {
      this.logger.warn(`No document found for s3 key: ${s3Key}`);
      return;
    }

    await this.documentsService.updateStatus(
      document.id,
      DocumentStatus.Processing,
    );
    this.sseService.publish(document.userEmail, 'document_status', {
      documentId: document.id,
      status: DocumentStatus.Processing,
    });

    try {
      const fileBuffer = await this.getS3ObjectBuffer(s3Key);
      const extractedText = await this.extractTextFromFile(s3Key, fileBuffer);

      const indexSource: DocumentIndexSource = {
        documentId: document.id,
        userEmail: document.userEmail,
        userFilename: document.userFilename,
        s3Filename: document.s3Filename,
        content: extractedText,
        uploadedAt: document.uploadedAt.toISOString(),
      };

      await this.openSearchService.client.index({
        index: this.openSearchIndex,
        id: document.id,
        body: indexSource,
        refresh: true,
      });

      await this.documentsService.updateStatus(
        document.id,
        DocumentStatus.Success,
      );
      this.sseService.publish(document.userEmail, 'document_status', {
        documentId: document.id,
        status: DocumentStatus.Success,
      });
    } catch (error) {
      const reason =
        error instanceof Error ? error.message : 'Unknown processing error';
      await this.documentsService.updateStatus(
        document.id,
        DocumentStatus.Error,
        reason,
      );
      this.sseService.publish(document.userEmail, 'document_status', {
        documentId: document.id,
        status: DocumentStatus.Error,
        errorMessage: reason,
      });
      throw error;
    }
  }

  private async getS3ObjectBuffer(s3Key: string): Promise<Buffer> {
    const response = await this.s3Service.client.send(
      new GetObjectCommand({
        Bucket: this.s3Bucket,
        Key: s3Key,
      }),
    );

    if (!response.Body) {
      throw new Error(`S3 object body is empty for key ${s3Key}`);
    }

    const bodyWithTransform = response.Body as {
      transformToByteArray?: () => Promise<Uint8Array>;
    };

    if (typeof bodyWithTransform.transformToByteArray === 'function') {
      const bytes = await bodyWithTransform.transformToByteArray();
      return Buffer.from(bytes);
    }

    throw new Error(
      'Unsupported S3 stream body: transformToByteArray is missing',
    );
  }

  private async extractTextFromFile(
    s3Key: string,
    buffer: Buffer,
  ): Promise<string> {
    const lowerKey = s3Key.toLowerCase();

    if (lowerKey.endsWith('.pdf')) {
      const parser = new PDFParse({ data: buffer });
      try {
        const parsed = await parser.getText();
        return parsed.text?.trim() || '';
      } finally {
        await parser.destroy();
      }
    }

    if (lowerKey.endsWith('.docx')) {
      const parsed = await mammoth.extractRawText({ buffer });
      return parsed.value?.trim() || '';
    }

    throw new Error(`Unsupported file type for key ${s3Key}`);
  }
}
