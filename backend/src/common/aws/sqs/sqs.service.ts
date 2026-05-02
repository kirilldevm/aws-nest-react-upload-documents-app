import { SQSClient } from '@aws-sdk/client-sqs';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class SqsService {
  readonly client: SQSClient;

  constructor(private readonly configService: ConfigService) {
    const region = this.configService.getOrThrow<string>('config.aws.region');
    this.client = new SQSClient({ region });
  }
}
