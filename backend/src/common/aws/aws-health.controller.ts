import { HeadBucketCommand } from '@aws-sdk/client-s3';
import { GetQueueAttributesCommand } from '@aws-sdk/client-sqs';
import { Controller, Get, UseGuards } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiKeyGuard } from '../guards/api-key.guard';
import { OpenSearchService } from './opensearch/opensearch.service';
import { S3Service } from './s3/s3.service';
import { SqsService } from './sqs/sqs.service';

@Controller('aws')
@UseGuards(ApiKeyGuard)
export class AwsHealthController {
  constructor(
    private readonly s3Service: S3Service,
    private readonly sqsService: SqsService,
    private readonly openSearchService: OpenSearchService,
    private readonly configService: ConfigService,
  ) {}

  @Get('health')
  async health() {
    const s3Bucket = this.configService.getOrThrow<string>(
      'config.aws.s3Bucket',
    );
    const sqsQueueUrl = this.configService.getOrThrow<string>(
      'config.aws.sqsQueueUrl',
    );
    const opensearchIndex = this.configService.getOrThrow<string>(
      'config.aws.opensearchIndex',
    );

    const s3Promise = this.s3Service.client.send(
      new HeadBucketCommand({ Bucket: s3Bucket }),
    );
    const sqsPromise = this.sqsService.client.send(
      new GetQueueAttributesCommand({
        QueueUrl: sqsQueueUrl,
        AttributeNames: ['QueueArn'],
      }),
    );
    const openSearchPromise = this.openSearchService.client.indices.exists({
      index: opensearchIndex,
    });

    const [s3Result, sqsResult, openSearchResult] = await Promise.allSettled([
      s3Promise,
      sqsPromise,
      openSearchPromise,
    ]);

    return {
      s3: s3Result.status === 'fulfilled' ? 'ok' : 'error',
      sqs: sqsResult.status === 'fulfilled' ? 'ok' : 'error',
      openSearch: openSearchResult.status === 'fulfilled' ? 'ok' : 'error',
      details: {
        s3:
          s3Result.status === 'rejected'
            ? ((s3Result.reason as Error)?.message ?? 'Unknown S3 error')
            : 'Connected',
        sqs:
          sqsResult.status === 'rejected'
            ? ((sqsResult.reason as Error)?.message ?? 'Unknown SQS error')
            : 'Connected',
        openSearch:
          openSearchResult.status === 'rejected'
            ? ((openSearchResult.reason as Error)?.message ??
              'Unknown OpenSearch error')
            : 'Connected',
      },
    };
  }
}
