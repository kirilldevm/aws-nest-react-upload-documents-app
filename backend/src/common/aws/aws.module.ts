import { forwardRef, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DocumentsModule } from '../../modules/documents/documents.module';
import { SseModule } from '../../modules/sse/sse.module';
import { ApiKeyGuard } from '../guards/api-key.guard';
import { AwsHealthController } from './aws-health.controller';
import { OpenSearchService } from './opensearch/opensearch.service';
import { S3Service } from './s3/s3.service';
import { SqsListenerService } from './sqs/sqs-listener.service';
import { SqsService } from './sqs/sqs.service';

@Module({
  imports: [ConfigModule, forwardRef(() => DocumentsModule), SseModule],
  controllers: [AwsHealthController],
  providers: [
    S3Service,
    SqsService,
    OpenSearchService,
    SqsListenerService,
    ApiKeyGuard,
  ],
  exports: [S3Service, SqsService, OpenSearchService],
})
export class AwsModule {}
