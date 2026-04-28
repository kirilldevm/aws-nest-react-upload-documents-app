import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AwsHealthController } from './aws-health.controller';
import { AwsService } from './aws.service';
import { SqsListenerService } from './sqs-listener.service';

@Module({
  imports: [ConfigModule],
  controllers: [AwsHealthController],
  providers: [AwsService, SqsListenerService],
  exports: [AwsService],
})
export class AwsModule {}
