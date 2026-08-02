import { Module } from '@nestjs/common';
import { DocumentsController } from './documents.controller';
import { DocumentsService } from './documents.service';
import { LocalStorageProvider } from './storage/local-storage.provider';
import { STORAGE_PROVIDER } from './storage/storage-provider.interface';

@Module({
  controllers: [DocumentsController],
  providers: [
    DocumentsService,
    // The only line that changes when swapping to Azure Blob Storage later:
    // { provide: STORAGE_PROVIDER, useClass: AzureBlobStorageProvider }
    { provide: STORAGE_PROVIDER, useClass: LocalStorageProvider },
  ],
})
export class DocumentsModule {}
