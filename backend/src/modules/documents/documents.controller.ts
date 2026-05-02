import {
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
import { CreatePendingDocumentDto } from './dto/create-pending-document.dto';
import { DeleteDocumentParamDto } from './dto/delete-document-param.dto';
import { ListDocumentsQueryDto } from './dto/list-documents-query.dto';
import { SearchDocumentsQueryDto } from './dto/search-documents-query.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import { UserEmailQueryDto } from './dto/user-email-query.dto';

@Controller('documents')
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Post('pending')
  async initiatePending(@Body() body: CreatePendingDocumentDto) {
    return this.documentsService.initiatePendingDocument(body);
  }

  @Post(':id/presign')
  async presignPutUrl(
    @Param() params: DeleteDocumentParamDto,
    @Query() query: UserEmailQueryDto,
  ) {
    return this.documentsService.createPresignedPutForDocument(
      params.id,
      query.userEmail,
    );
  }

  @Get()
  async listByUser(@Query() query: ListDocumentsQueryDto) {
    return this.documentsService.findByUserEmail(query.userEmail);
  }

  @Get('search')
  async searchByUser(@Query() query: SearchDocumentsQueryDto) {
    return this.documentsService.searchByUserEmail(query.userEmail, query.q);
  }

  @Patch('status')
  async updateStatus(@Body() body: UpdateStatusDto) {
    await this.documentsService.updateStatus(
      body.documentId,
      body.status,
      body.errorMessage,
    );

    return { ok: true };
  }

  @Delete(':id')
  async deleteById(
    @Param() params: DeleteDocumentParamDto,
    @Query() query: UserEmailQueryDto,
  ) {
    return this.documentsService.deleteByIdForUser(params.id, query.userEmail);
  }
}
