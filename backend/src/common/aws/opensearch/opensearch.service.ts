import { defaultProvider } from '@aws-sdk/credential-provider-node';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Client as OpenSearchClient } from '@opensearch-project/opensearch';
import { AwsSigv4Signer } from '@opensearch-project/opensearch/aws';

@Injectable()
export class OpenSearchService {
  readonly client: OpenSearchClient;

  constructor(private readonly configService: ConfigService) {
    const region = this.configService.getOrThrow<string>('config.aws.region');
    const node = this.configService.getOrThrow<string>(
      'config.aws.opensearchNode',
    );
    const username = this.configService.get<string>(
      'config.aws.opensearchUsername',
    );
    const password = this.configService.get<string>(
      'config.aws.opensearchPassword',
    );
    const hasBasicAuth = username && password;

    this.client = hasBasicAuth
      ? new OpenSearchClient({
          node,
          auth: { username: username as string, password: password as string },
        })
      : new OpenSearchClient({
          ...AwsSigv4Signer({
            region,
            service: 'es',
            getCredentials: () => defaultProvider()(),
          }),
          node,
        });
  }
}
