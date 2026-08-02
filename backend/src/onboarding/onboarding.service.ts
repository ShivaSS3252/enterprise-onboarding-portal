import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { TaskStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTaskDto } from './dto/create-task.dto';

// Shape returned alongside each task so the UI can show who it's assigned to
// without a separate lookup.
const taskInclude = {
  assignedTo: { select: { id: true, firstName: true, lastName: true, email: true } },
  createdBy: { select: { id: true, firstName: true, lastName: true, email: true } },
};

@Injectable()
export class OnboardingService {
  constructor(private readonly prisma: PrismaService) {}

  create(dto: CreateTaskDto, createdById: string) {
    return this.prisma.onboardingTask.create({
      data: {
        title: dto.title,
        description: dto.description,
        assignedToId: dto.assignedToId,
        createdById,
      },
      include: taskInclude,
    });
  }

  findAll() {
    return this.prisma.onboardingTask.findMany({
      include: taskInclude,
      orderBy: { createdAt: 'desc' },
    });
  }

  findMine(employeeId: string) {
    return this.prisma.onboardingTask.findMany({
      where: { assignedToId: employeeId },
      include: taskInclude,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const task = await this.prisma.onboardingTask.findUnique({
      where: { id },
      include: taskInclude,
    });
    if (!task) {
      throw new NotFoundException(`Task with id ${id} not found`);
    }
    return task;
  }

  // Only the employee this task is assigned to may mark it complete —
  // this is the ownership check the JwtAuthGuard alone can't express.
  async complete(id: string, employeeId: string) {
    const task = await this.findOne(id);

    if (task.assignedToId !== employeeId) {
      throw new ForbiddenException('You can only complete tasks assigned to you');
    }

    return this.prisma.onboardingTask.update({
      where: { id },
      data: { status: TaskStatus.COMPLETED, completedAt: new Date() },
      include: taskInclude,
    });
  }

  async remove(id: string) {
    await this.findOne(id); // throws NotFoundException if missing
    await this.prisma.onboardingTask.delete({ where: { id } });
  }
}
