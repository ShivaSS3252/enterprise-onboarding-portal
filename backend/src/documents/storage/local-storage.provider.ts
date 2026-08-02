import { Injectable } from '@nestjs/common';
import { promises as fs } from 'fs';
import * as path from 'path';
import { StorageProvider, UploadedFileResult } from './storage-provider.interface';

const UPLOAD_ROOT = path.join(process.cwd(), 'uploads');

@Injectable()
export class LocalStorageProvider implements StorageProvider {
  async upload(file: Express.Multer.File, key: string): Promise<UploadedFileResult> {
    await fs.mkdir(UPLOAD_ROOT, { recursive: true });

    const storedPath = path.join(UPLOAD_ROOT, key);
    await fs.writeFile(storedPath, file.buffer);

    return { storedPath };
  }

  async delete(storedPath: string): Promise<void> {
    await fs.rm(storedPath, { force: true });
  }
}
