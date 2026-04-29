import { PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import { extname } from 'path';
import { ALLOWED_FILE_EXTENSIONS, MAX_UPLOAD_BYTES } from 'src/constants';
import { AwsService } from '../../common/aws/aws.service';
import { DocumentsService } from '../documents/documents.service';
import { CreateDocumentDto } from '../documents/dto/create-document.dto';
import { DocumentStatus } from '../documents/entities/document-status.enum';
import { SseService } from '../sse/sse.service';
import { CreateUploadPresignDto } from './dto/create-upload-presign.dto';

@Injectable()
export class UploadsService {
  constructor(
    private readonly awsService: AwsService,
    private readonly documentsService: DocumentsService,
    private readonly sseService: SseService,
    private readonly configService: ConfigService,
  ) {}

  async createPresign(dto: CreateUploadPresignDto) {
    if (!dto.userEmail) throw new BadRequestException('userEmail is required');
    if (!dto.originalFilename)
      throw new BadRequestException('originalFilename is required');
    if (!dto.mimeType) throw new BadRequestException('mimeType is required');
    if (typeof dto.sizeBytes !== 'number' || Number.isNaN(dto.sizeBytes)) {
      throw new BadRequestException('sizeBytes must be a number');
    }

    if (dto.sizeBytes > MAX_UPLOAD_BYTES) {
      throw new BadRequestException(`File must be < ${MAX_UPLOAD_BYTES} bytes`);
    }

    const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(dto.userEmail);
    if (!emailValid) throw new BadRequestException('Invalid email');

    const extRaw = extname(dto.originalFilename).toLowerCase();
    const allowed = ALLOWED_FILE_EXTENSIONS;
    if (!allowed.has(extRaw)) {
      throw new BadRequestException(
        `Only ${Array.from(allowed).join(', ')} files are allowed`,
      );
    }

    // only one file upload per time
    const active = await this.documentsService.findActiveByUserEmail(
      dto.userEmail,
    );
    if (active) {
      throw new ConflictException(
        'You already have a document uploading/indexing. Upload after it finishes.',
      );
    }

    const s3Bucket = this.configService.getOrThrow<string>(
      'config.aws.s3Bucket',
    );
    const presignExpiresSeconds = this.configService.get<number>(
      'config.aws.s3PresignExpiresSeconds',
    );

    const s3Filename = `documents/${randomUUID()}${extRaw}`;

    // Persist DB so frontend can show pending status
    const documentDto: CreateDocumentDto = {
      userEmail: dto.userEmail,
      userFilename: dto.originalFilename,
      s3Filename,
      mimeType: dto.mimeType,
      sizeBytes: dto.sizeBytes,
    };

    const document =
      await this.documentsService.createPendingDocument(documentDto);

    // Notify SSE listeners
    this.sseService.publish(dto.userEmail, 'document_status', {
      documentId: document.id,
      status: DocumentStatus.Pending,
    });

    const s3Client = this.awsService.createS3Client();
    const putCommand = new PutObjectCommand({
      Bucket: s3Bucket,
      Key: s3Filename,
      ContentType: dto.mimeType,
      ContentLength: dto.sizeBytes,
    });

    const presignedUrl = await getSignedUrl(s3Client, putCommand, {
      expiresIn: presignExpiresSeconds,
    });

    return {
      documentId: document.id,
      s3Filename,
      presignedUrl,
      headers: {
        'Content-Type': dto.mimeType,
      },
    };
  }
}
