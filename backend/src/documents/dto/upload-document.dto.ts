import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsUUID } from 'class-validator';

// Multipart form fields alongside the file itself.
export class UploadDocumentDto {
  @ApiPropertyOptional({ description: 'Onboarding task this document relates to, if any' })
  @IsOptional()
  @IsUUID()
  taskId?: string;
}
