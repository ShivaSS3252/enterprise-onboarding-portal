// Any storage backend (local disk, Azure Blob Storage, S3, ...) implements this.
// DocumentsService only ever talks to this interface, never a concrete implementation —
// swapping local storage for Azure Blob Storage later means writing one new class
// and changing one line in DocumentsModule, not touching DocumentsService at all.
export interface UploadedFileResult {
  // Where the file actually lives — a local path today, a Blob URL later.
  // Kept generic on purpose so both backends can populate it meaningfully.
  storedPath: string;
}

export interface StorageProvider {
  upload(file: Express.Multer.File, key: string): Promise<UploadedFileResult>;
  delete(storedPath: string): Promise<void>;
}

export const STORAGE_PROVIDER = 'STORAGE_PROVIDER';
