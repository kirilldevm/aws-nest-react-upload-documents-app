import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { In, IsNull, Repository } from 'typeorm';
import { AwsService } from '../../common/aws/aws.service';
import { CreateDocumentDto } from './dto/create-document.dto';
import { DocumentStatus } from './entities/document-status.enum';
import { DocumentEntity } from './entities/document.entity';

type OpenSearchHit = {
  _id: string;
  _source?: {
    userFilename?: string;
    uploadedAt?: string;
  };
  highlight?: {
    content?: string[];
  };
};

@Injectable()
export class DocumentsService {
  constructor(
    @InjectRepository(DocumentEntity)
    private readonly documentsRepository: Repository<DocumentEntity>,
    private readonly configService: ConfigService,
    private readonly awsService: AwsService,
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

  async searchByUserEmail(userEmail: string, query: string) {
    const openSearchClient = this.awsService.createOpenSearchClient();
    const index = this.configService.getOrThrow<string>(
      'config.aws.opensearchIndex',
    );

    const response = await openSearchClient.search({
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

    const hits = (response.body.hits?.hits ?? []) as unknown as OpenSearchHit[];

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
}
