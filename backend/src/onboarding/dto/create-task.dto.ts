import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID, MinLength } from 'class-validator';

export class CreateTaskDto {
  @ApiProperty({ example: 'Complete security training', minLength: 3 })
  @IsString()
  @MinLength(3)
  title: string;

  @ApiPropertyOptional({ example: 'Watch the video and sign off' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'User id of the employee this task is assigned to' })
  @IsUUID()
  assignedToId: string;
}
