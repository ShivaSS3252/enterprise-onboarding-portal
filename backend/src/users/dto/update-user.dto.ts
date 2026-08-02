// @nestjs/swagger's PartialType/OmitType (not @nestjs/mapped-types') are used here
// so the derived DTO keeps the @ApiProperty() metadata from CreateUserDto in the Swagger docs.
import { PartialType, OmitType } from '@nestjs/swagger';
import { CreateUserDto } from './create-user.dto';

// All CreateUserDto fields become optional, and password can't be updated
// through this endpoint (that belongs in a dedicated change-password flow, not here).
export class UpdateUserDto extends PartialType(
  OmitType(CreateUserDto, ['password'] as const),
) {}
