import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { OnboardingService } from './onboarding.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { JwtPayload } from '../auth/jwt-payload.interface';

@ApiTags('onboarding')
@ApiBearerAuth()
@Controller('onboarding')
@UseGuards(JwtAuthGuard)
export class OnboardingController {
  constructor(private readonly onboardingService: OnboardingService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: '[Admin] Create and assign an onboarding task' })
  create(@Body() dto: CreateTaskDto, @CurrentUser() user: JwtPayload) {
    return this.onboardingService.create(dto, user.sub);
  }

  @Get()
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: '[Admin] List all onboarding tasks' })
  findAll() {
    return this.onboardingService.findAll();
  }

  // Route order matters: /mine must come before /:id, or Nest would try to
  // parse "mine" as a UUID and fail with a 400 on ParseUUIDPipe.
  @Get('mine')
  @ApiOperation({ summary: 'List the current user\'s own assigned tasks' })
  findMine(@CurrentUser() user: JwtPayload) {
    return this.onboardingService.findMine(user.sub);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single task by id' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.onboardingService.findOne(id);
  }

  @Patch(':id/complete')
  @ApiOperation({ summary: 'Mark a task complete (only the assigned employee may do this)' })
  complete(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: JwtPayload) {
    return this.onboardingService.complete(id, user.sub);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '[Admin] Delete a task' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.onboardingService.remove(id);
  }
}
