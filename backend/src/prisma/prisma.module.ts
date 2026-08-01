import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

// @Global() means every other module can inject PrismaService without
// explicitly importing PrismaModule in their own module's `imports` array.
// This is a deliberate exception to normal module encapsulation, since
// almost every feature module needs DB access.
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
