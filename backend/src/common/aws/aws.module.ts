import { forwardRef, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DocumentsModule } from '../../modules/documents/documents.module';
import { SseModule } from '../../modules/sse/sse.module';
import { AwsHealthController } from './aws-health.controller';
import { AwsService } from './aws.service';
import { SqsListenerService } from './sqs-listener.service';

@Module({
  imports: [ConfigModule, forwardRef(() => DocumentsModule), SseModule],
  controllers: [AwsHealthController],
  providers: [AwsService, SqsListenerService],
  exports: [AwsService],
})
export class AwsModule {}
