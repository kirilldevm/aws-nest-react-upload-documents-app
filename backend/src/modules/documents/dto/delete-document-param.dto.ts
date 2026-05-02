import { IsUUID } from 'class-validator';

export class DeleteDocumentParamDto {
  @IsUUID()
  id: string;
}
