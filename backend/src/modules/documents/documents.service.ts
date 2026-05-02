import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { DeleteObjectCommand } from '@aws-sdk/client-s3';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { randomUUID } from 'crypto';
import { extname } from 'path';
import { In, IsNull, Repository } from 'typeorm';
import { OpenSearchService } from '../../common/aws/opensearch/opensearch.service';
import { S3Service } from '../../common/aws/s3/s3.service';
import type {
  DocumentIndexSource,
  OpenSearchHit,
} from '../../common/aws/types';
import { SseService } from '../sse/sse.service';
import { CreateDocumentDto } from './dto/create-document.dto';
import { CreatePendingDocumentDto } from './dto/create-pending-document.dto';
import { DocumentStatus } from './entities/document-status.enum';
import { DocumentEntity } from './entities/document.entity';

@Injectable()
export class DocumentsService {
  constructor(
    @InjectRepository(DocumentEntity)
    private readonly documentsRepository: Repository<DocumentEntity>,
    private readonly configService: ConfigService,
    private readonly s3Service: S3Service,
    private readonly openSearchService: OpenSearchService,
    private readonly sseService: SseService,
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

  async initiatePendingDocument(dto: CreatePendingDocumentDto) {
    const active = await this.findActiveByUserEmail(dto.userEmail);
    if (active) {
      throw new ConflictException(
        'You already have a document uploading/indexing. Upload after it finishes.',
      );
    }

    const extRaw = extname(dto.originalFilename).toLowerCase();
    const s3Filename = `documents/${randomUUID()}${extRaw}`;

    const document = await this.createPendingDocument({
      userEmail: dto.userEmail,
      userFilename: dto.originalFilename,
      s3Filename,
      mimeType: dto.mimeType,
      sizeBytes: dto.sizeBytes,
    });

    this.sseService.publish(dto.userEmail, 'document_status', {
      documentId: document.id,
      status: DocumentStatus.Pending,
    });

    return {
      documentId: document.id,
      s3Filename,
      mimeType: dto.mimeType,
      sizeBytes: dto.sizeBytes,
    };
  }

  async createPresignedPutForDocument(documentId: string, userEmail: string) {
    const document = await this.documentsRepository.findOne({
      where: {
        id: documentId,
        userEmail,
        deletedAt: IsNull(),
      },
    });

    if (!document) {
      throw new NotFoundException('Document not found');
    }

    if (document.status !== DocumentStatus.Pending) {
      throw new ConflictException(
        'Upload URL is only available while the document is pending.',
      );
    }

    return this.s3Service.signPutObject({
      key: document.s3Filename,
      contentType: document.mimeType,
      contentLength: Number(document.sizeBytes),
    });
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

  async searchByUserEmail(userEmail: string, query: string) {
    const index = this.configService.getOrThrow<string>(
      'config.aws.opensearchIndex',
    );

    const response = await this.openSearchService.client.search({
      index,
      body: {
        size: 20,
        query: {
          bool: {
            must: [
              {
                match: {
                  content: {
                    query,
                    fuzziness: 'AUTO',
                  },
                },
              },
            ],
            filter: [
              {
                term: {
                  'userEmail.keyword': userEmail,
                },
              },
            ],
          },
        },
        highlight: {
          fields: {
            content: {
              fragment_size: 180,
              number_of_fragments: 3,
            },
          },
        },
      },
    });

    const hits = (response.body.hits?.hits ??
      []) as unknown as OpenSearchHit<DocumentIndexSource>[];

    const ids = hits.map((hit) => hit._id);
    const docs = ids.length
      ? await this.documentsRepository.find({
          where: {
            id: In(ids),
            userEmail,
            deletedAt: IsNull(),
          },
        })
      : [];

    const docById = new Map(docs.map((doc) => [doc.id, doc]));

    return hits
      .filter((hit) => docById.has(hit._id))
      .map((hit) => {
        const dbDoc = docById.get(hit._id);
        return {
          documentId: hit._id,
          filename: hit._source?.userFilename ?? dbDoc?.userFilename ?? null,
          uploadedAt: hit._source?.uploadedAt ?? dbDoc?.uploadedAt ?? null,
          status: dbDoc?.status ?? null,
          highlights: hit.highlight?.content ?? [],
        };
      });
  }

  async deleteByIdForUser(documentId: string, userEmail: string) {
    const document = await this.documentsRepository.findOne({
      where: {
        id: documentId,
        userEmail,
        deletedAt: IsNull(),
      },
    });

    if (!document) {
      throw new NotFoundException('Document not found');
    }

    const openSearchIndex = this.configService.getOrThrow<string>(
      'config.aws.opensearchIndex',
    );

    const [s3Result, openSearchResult] = await Promise.allSettled([
      this.s3Service.client.send(
        new DeleteObjectCommand({
          Bucket: document.s3Bucket,
          Key: document.s3Filename,
        }),
      ),
      this.openSearchService.client.delete({
        index: openSearchIndex,
        id: document.id,
      }),
    ]);

    const openSearchDeleteFailed =
      openSearchResult.status === 'rejected' &&
      !this.isOpenSearchNotFoundError(openSearchResult.reason);

    if (s3Result.status === 'rejected' || openSearchDeleteFailed) {
      const details = {
        s3:
          s3Result.status === 'fulfilled'
            ? 'ok'
            : s3Result.reason instanceof Error
              ? s3Result.reason.message
              : 'S3 delete failed',
        openSearch:
          openSearchResult.status === 'fulfilled'
            ? 'ok'
            : this.isOpenSearchNotFoundError(openSearchResult.reason)
              ? 'not_found_ignored'
              : openSearchResult.reason instanceof Error
                ? openSearchResult.reason.message
                : 'OpenSearch delete failed',
      };

      throw new InternalServerErrorException({
        message: 'Document deletion partially failed',
        details,
      });
    }

    await this.documentsRepository.update(
      { id: document.id },
      { deletedAt: new Date() },
    );

    this.sseService.publish(userEmail, 'document_deleted', {
      documentId: document.id,
    });

    return {
      ok: true,
      documentId: document.id,
      cleanup: {
        db: 'soft_deleted',
        s3: 'deleted',
        openSearch:
          openSearchResult.status === 'fulfilled'
            ? 'deleted'
            : 'not_found_ignored',
      },
    };
  }

  private isOpenSearchNotFoundError(error: unknown) {
    if (!error || typeof error !== 'object') return false;
    const maybeMeta = error as {
      meta?: { statusCode?: number };
      statusCode?: number;
      message?: string;
    };

    return (
      maybeMeta.meta?.statusCode === 404 ||
      maybeMeta.statusCode === 404 ||
      maybeMeta.message?.includes('404') === true
    );
  }
}
