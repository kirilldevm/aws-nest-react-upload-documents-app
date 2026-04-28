import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { DocumentStatus } from './entities/document-status.enum';
import { DocumentEntity } from './entities/document.entity';

type CreateDocumentParams = {
  userEmail: string;
  userFilename: string;
  s3Filename: string;
  s3Bucket: string;
  mimeType: string;
  sizeBytes: number;
};

@Injectable()
export class DocumentsService {
  constructor(
    @InjectRepository(DocumentEntity)
    private readonly documentsRepository: Repository<DocumentEntity>,
  ) {}

  async createPendingDocument(params: CreateDocumentParams) {
    const document = this.documentsRepository.create({
      userEmail: params.userEmail,
      userFilename: params.userFilename,
      s3Filename: params.s3Filename,
      s3Bucket: params.s3Bucket,
      mimeType: params.mimeType,
      sizeBytes: String(params.sizeBytes),
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
