import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { UploadDocumentDto } from './dto/upload-document.dto';
import { STORAGE_PROVIDER } from './storage/storage-provider.interface';
import type { StorageProvider } from './storage/storage-provider.interface';

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB
const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/png',
  'image/jpeg',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

@Injectable()
export class DocumentsService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(STORAGE_PROVIDER) private readonly storage: StorageProvider,
  ) {}

  async upload(file: Express.Multer.File, dto: UploadDocumentDto, uploadedById: string) {
    if (!file) {
      throw new BadRequestException('No file was provided');
    }
    if (file.size > MAX_FILE_SIZE_BYTES) {
      throw new BadRequestException('File exceeds the 10 MB size limit');
    }
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      throw new BadRequestException(`File type ${file.mimetype} is not allowed`);
    }

    // A random key, not the user-supplied filename, is what we actually store under —
    // prevents path traversal and collisions from untrusted filenames.
    const storageKey = `${randomUUID()}-${file.originalname}`;
    const { storedPath } = await this.storage.upload(file, storageKey);

    return this.prisma.document.create({
      data: {
        fileName: file.originalname,
        filePath: storedPath,
        mimeType: file.mimetype,
        sizeBytes: file.size,
        uploadedById,
        taskId: dto.taskId,
      },
    });
  }

  findMine(userId: string) {
    return this.prisma.document.findMany({
      where: { uploadedById: userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  findAll() {
    return this.prisma.document.findMany({ orderBy: { createdAt: 'desc' } });
  }

  async findOne(id: string) {
    const document = await this.prisma.document.findUnique({ where: { id } });
    if (!document) {
      throw new NotFoundException(`Document with id ${id} not found`);
    }
    return document;
  }

  async remove(id: string, requesterId: string, isAdmin: boolean) {
    const document = await this.findOne(id);

    if (!isAdmin && document.uploadedById !== requesterId) {
      throw new ForbiddenException('You can only delete documents you uploaded');
    }

    await this.storage.delete(document.filePath);
    await this.prisma.document.delete({ where: { id } });
  }
}
