import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { In, IsNull, Repository } from 'typeorm';
import { CreateDocumentDto } from './dto/create-document.dto';
import { DocumentStatus } from './entities/document-status.enum';
import { DocumentEntity } from './entities/document.entity';

@Injectable()
export class DocumentsService {
  constructor(
    @InjectRepository(DocumentEntity)
    private readonly documentsRepository: Repository<DocumentEntity>,
    private readonly configService: ConfigService,
  ) {}

  async createPendingDocument(dto: CreateDocumentDto) {
    const document = this.documentsRepository.create({
      userEmail: dto.userEmail,
      userFilename: dto.userFilename,
      s3Filename: dto.s3Filename,
      s3Bucket: this.configService.getOrThrow<string>('config.aws.s3Bucket'),
      mimeType: dto.mimeType,
      sizeBytes: String(dto.sizeBytes),
      status: DocumentStatus.Pending,
      errorMessage: null,
      indexedAt: null,
      deletedAt: null,
    });

    return this.documentsRepository.save(document);
  }

  async findByUserEmail(userEmail: string) {
    return this.documentsRepository.find({
      where: {
        userEmail,
        deletedAt: IsNull(),
      },
      order: {
        uploadedAt: 'DESC',
      },
    });
  }

  async findActiveByUserEmail(userEmail: string) {
    return this.documentsRepository.findOne({
      where: {
        userEmail,
        deletedAt: IsNull(),
        status: In([DocumentStatus.Pending, DocumentStatus.Processing]),
      },
      order: {
        uploadedAt: 'DESC',
      },
    });
  }

  async findByS3Filename(s3Filename: string) {
    return this.documentsRepository.findOne({
      where: {
        s3Filename,
        deletedAt: IsNull(),
      },
    });
  }

  async updateStatus(
    documentId: string,
    status: DocumentStatus,
    errorMessage?: string,
  ) {
    const indexedAt = status === DocumentStatus.Success ? new Date() : null;

    await this.documentsRepository.update(
      { id: documentId },
      {
        status,
        indexedAt,
        errorMessage: errorMessage ?? null,
      },
    );
  }
}
