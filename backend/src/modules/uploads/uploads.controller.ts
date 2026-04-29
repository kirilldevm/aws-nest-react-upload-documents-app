import { Body, Controller, Post } from '@nestjs/common';
import { CreateUploadPresignDto } from './dto/create-upload-presign.dto';
import { UploadsService } from './uploads.service';

@Controller('uploads')
export class UploadsController {
  constructor(private readonly uploadsService: UploadsService) {}

  @Post('presign')
  createPresign(@Body() dto: CreateUploadPresignDto) {
    return this.uploadsService.createPresign(dto);
  }
}
