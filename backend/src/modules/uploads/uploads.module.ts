import { Module } from '@nestjs/common';
import { AwsModule } from '../../common/aws/aws.module';
import { DocumentsModule } from '../documents/documents.module';
import { SseModule } from '../sse/sse.module';
import { UploadsController } from './uploads.controller';
import { UploadsService } from './uploads.service';

@Module({
  imports: [AwsModule, DocumentsModule, SseModule],
  controllers: [UploadsController],
  providers: [UploadsService],
})
export class UploadsModule {}
