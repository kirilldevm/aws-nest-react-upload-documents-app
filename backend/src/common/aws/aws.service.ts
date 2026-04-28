import { S3Client } from '@aws-sdk/client-s3';
import { SQSClient } from '@aws-sdk/client-sqs';
import { defaultProvider } from '@aws-sdk/credential-provider-node';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Client as OpenSearchClient } from '@opensearch-project/opensearch';
import { AwsSigv4Signer } from '@opensearch-project/opensearch/aws';

@Injectable()
export class AwsService {
  private readonly region: string;
  private readonly opensearchNode: string;
  private readonly opensearchUsername?: string;
  private readonly opensearchPassword?: string;

  constructor(private readonly configService: ConfigService) {
    this.region = this.configService.getOrThrow<string>('config.aws.region');
    this.opensearchNode = this.configService.getOrThrow<string>(
      'config.aws.opensearchNode',
    );
    this.opensearchUsername = this.configService.get<string>(
      'config.aws.opensearchUsername',
    );
    this.opensearchPassword = this.configService.get<string>(
      'config.aws.opensearchPassword',
    );
  }

  createS3Client(): S3Client {
    return new S3Client({
      region: this.region,
    });
  }

  createSqsClient(): SQSClient {
    return new SQSClient({
      region: this.region,
    });
  }

  createOpenSearchClient(): OpenSearchClient {
    const hasBasicAuth = this.opensearchUsername && this.opensearchPassword;

    if (!hasBasicAuth) {
      return new OpenSearchClient({
        ...AwsSigv4Signer({
          region: this.region,
          service: 'es',
          getCredentials: () => defaultProvider()(),
        }),
        node: this.opensearchNode,
      });
    }

    return new OpenSearchClient({
      node: this.opensearchNode,
      auth: {
        username: this.opensearchUsername,
        password: this.opensearchPassword,
      },
    });
  }
}
