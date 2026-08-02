import { IsOptional, IsUUID } from 'class-validator';

// Multipart form fields alongside the file itself.
export class UploadDocumentDto {
  @IsOptional()
  @IsUUID()
  taskId?: string;
}
