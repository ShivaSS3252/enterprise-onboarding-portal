import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { TaskStatus } from '@prisma/client';
import { OnboardingService } from './onboarding.service';
import { PrismaService } from '../prisma/prisma.service';

describe('OnboardingService', () => {
  let service: OnboardingService;
  let prisma: {
    onboardingTask: {
      create: jest.Mock;
      findMany: jest.Mock;
      findUnique: jest.Mock;
      update: jest.Mock;
      delete: jest.Mock;
    };
  };

  const mockTask = {
    id: 'task-1',
    title: 'Complete security training',
    description: null,
    status: TaskStatus.PENDING,
    createdAt: new Date(),
    updatedAt: new Date(),
    completedAt: null,
    assignedToId: 'employee-1',
    createdById: 'admin-1',
  };

  beforeEach(async () => {
    prisma = {
      onboardingTask: {
        create: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [OnboardingService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = module.get(OnboardingService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findOne', () => {
    it('throws NotFoundException when the task does not exist', async () => {
      prisma.onboardingTask.findUnique.mockResolvedValue(null);

      await expect(service.findOne('missing-id')).rejects.toThrow(NotFoundException);
    });

    it('returns the task when it exists', async () => {
      prisma.onboardingTask.findUnique.mockResolvedValue(mockTask);

      const result = await service.findOne('task-1');

      expect(result).toEqual(mockTask);
    });
  });

  describe('complete — ownership check', () => {
    it('throws ForbiddenException when the requester is not the assigned employee', async () => {
      // Arrange: task is assigned to 'employee-1', but a different user ('someone-else')
      // is the one calling complete() — this is the exact scenario Step 5 verified
      // manually with curl (even an Admin can't complete someone else's task).
      prisma.onboardingTask.findUnique.mockResolvedValue(mockTask);

      await expect(service.complete('task-1', 'someone-else')).rejects.toThrow(
        ForbiddenException,
      );
      expect(prisma.onboardingTask.update).not.toHaveBeenCalled();
    });

    it('marks the task COMPLETED when the requester is the assigned employee', async () => {
      prisma.onboardingTask.findUnique.mockResolvedValue(mockTask);
      prisma.onboardingTask.update.mockResolvedValue({
        ...mockTask,
        status: TaskStatus.COMPLETED,
        completedAt: new Date(),
      });

      const result = await service.complete('task-1', 'employee-1');

      expect(prisma.onboardingTask.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'task-1' },
          data: expect.objectContaining({ status: TaskStatus.COMPLETED }),
        }),
      );
      expect(result.status).toBe(TaskStatus.COMPLETED);
    });

    it('throws NotFoundException (not ForbiddenException) when the task does not exist at all', async () => {
      // The existence check must happen before the ownership check —
      // otherwise a nonexistent task id would incorrectly report as "forbidden".
      prisma.onboardingTask.findUnique.mockResolvedValue(null);

      await expect(service.complete('missing-id', 'employee-1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('remove', () => {
    it('throws NotFoundException instead of deleting when the task does not exist', async () => {
      prisma.onboardingTask.findUnique.mockResolvedValue(null);

      await expect(service.remove('missing-id')).rejects.toThrow(NotFoundException);
      expect(prisma.onboardingTask.delete).not.toHaveBeenCalled();
    });

    it('deletes the task when it exists', async () => {
      prisma.onboardingTask.findUnique.mockResolvedValue(mockTask);

      await service.remove('task-1');

      expect(prisma.onboardingTask.delete).toHaveBeenCalledWith({ where: { id: 'task-1' } });
    });
  });
});
