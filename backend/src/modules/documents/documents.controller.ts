import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { DocumentsService } from './documents.service';
import { CreateDocumentDto } from './dto/create-document.dto';
import { UpdateStatusDto } from './dto/update-status.dto';

@Controller('documents')
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Post()
  async createPendingDocument(@Body() body: CreateDocumentDto) {
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
  async updateStatus(@Body() body: UpdateStatusDto) {
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

  @Delete(':id')
  async deleteById(
    @Param('id') documentId?: string,
    @Query('userEmail') userEmail?: string,
  ) {
    if (!documentId) {
      throw new BadRequestException('Document id is required');
    }
    if (!userEmail) {
      throw new BadRequestException('userEmail query parameter is required');
    }

    return this.documentsService.deleteByIdForUser(documentId, userEmail);
  }
}
