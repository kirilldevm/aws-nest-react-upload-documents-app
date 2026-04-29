import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { DocumentsService } from './documents.service';
import { DocumentStatus } from './entities/document-status.enum';

type CreateDocumentBody = {
  userEmail: string;
  userFilename: string;
  s3Filename: string;
  s3Bucket: string;
  mimeType: string;
  sizeBytes: number;
};

type UpdateStatusBody = {
  documentId: string;
  status: DocumentStatus;
  errorMessage?: string;
};

@Controller('documents')
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Post()
  async createPendingDocument(@Body() body: CreateDocumentBody) {
    if (!body.userEmail || !body.userFilename || !body.s3Filename) {
      throw new BadRequestException(
        'userEmail, userFilename and s3Filename are required',
      );
    }

    if (typeof body.sizeBytes !== 'number' || Number.isNaN(body.sizeBytes)) {
      throw new BadRequestException('sizeBytes must be a number');
    }

    return this.documentsService.createPendingDocument(body);
  }

  @Get()
  async listByUser(@Query('userEmail') userEmail?: string) {
    if (!userEmail) {
      throw new BadRequestException('userEmail query parameter is required');
    }

    return this.documentsService.findByUserEmail(userEmail);
  }

  @Get('search')
  async searchByUser(
    @Query('userEmail') userEmail?: string,
    @Query('q') query?: string,
  ) {
    if (!userEmail) {
      throw new BadRequestException('userEmail query parameter is required');
    }

    if (!query?.trim()) {
      throw new BadRequestException('q query parameter is required');
    }

    return this.documentsService.searchByUserEmail(userEmail, query.trim());
  }

  @Patch('status')
  async updateStatus(@Body() body: UpdateStatusBody) {
    if (!body.documentId || !body.status) {
      throw new BadRequestException('documentId and status are required');
    }

    await this.documentsService.updateStatus(
      body.documentId,
      body.status,
      body.errorMessage,
    );

    return { ok: true };
  }
}
