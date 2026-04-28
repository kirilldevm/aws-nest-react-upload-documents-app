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
import { AwsService } from './aws.service';

@Injectable()
export class SqsListenerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(SqsListenerService.name);
  private readonly queueUrl: string;
  private readonly enabled: boolean;
  private readonly pollIntervalMs: number;
  private timer: NodeJS.Timeout | null = null;
  private isPolling = false;

  constructor(
    private readonly awsService: AwsService,
    private readonly configService: ConfigService,
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
      const sqsClient = this.awsService.createSqsClient();
      const result = await sqsClient.send(
        new ReceiveMessageCommand({
          QueueUrl: this.queueUrl,
          MaxNumberOfMessages: 5,
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
    const sqsClient = this.awsService.createSqsClient();

    try {
      this.logger.debug(`Message body: ${message.Body ?? '(empty)'}`);
      // TODO: parse S3 event message, process uploaded file, update status, emit SSE.

      if (message.ReceiptHandle) {
        await sqsClient.send(
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
}
