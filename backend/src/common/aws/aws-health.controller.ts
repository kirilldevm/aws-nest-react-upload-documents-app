import { HeadBucketCommand } from '@aws-sdk/client-s3';
import { GetQueueAttributesCommand } from '@aws-sdk/client-sqs';
import { Controller, Get } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AwsService } from './aws.service';

@Controller('aws')
export class AwsHealthController {
  constructor(
    private readonly awsService: AwsService,
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

    const s3Client = this.awsService.createS3Client();
    const sqsClient = this.awsService.createSqsClient();
    const openSearchClient = this.awsService.createOpenSearchClient();

    const s3Promise = s3Client.send(
      new HeadBucketCommand({ Bucket: s3Bucket }),
    );
    const sqsPromise = sqsClient.send(
      new GetQueueAttributesCommand({
        QueueUrl: sqsQueueUrl,
        AttributeNames: ['QueueArn'],
      }),
    );
    const openSearchPromise = openSearchClient.indices.exists({
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
