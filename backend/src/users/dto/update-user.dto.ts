import { PartialType, OmitType } from '@nestjs/mapped-types';
import { CreateUserDto } from './create-user.dto';

// All CreateUserDto fields become optional, and password can't be updated
// through this endpoint (that belongs in a dedicated change-password flow, not here).
export class UpdateUserDto extends PartialType(
  OmitType(CreateUserDto, ['password'] as const),
) {}
