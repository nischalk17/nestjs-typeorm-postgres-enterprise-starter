import { Module, UnsupportedMediaTypeException } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MulterModule } from '@nestjs/platform-express';
import { TypeOrmModule } from '@nestjs/typeorm';
import { randomUUID } from 'crypto';
import * as fs from 'fs';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { Media } from './entities/media.entity';
import { MEDIA_SUBDIR } from './uploads.constants';
import { UploadsController } from './uploads.controller';
import { UploadsService } from './uploads.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Media]),
    MulterModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const upload = configService.get<{
          dir: string;
          maxSizeMb: number;
          allowedMimetypes: string[];
        }>('upload')!;
        const destinationDir = join(upload.dir, MEDIA_SUBDIR);
        fs.mkdirSync(destinationDir, { recursive: true });

        return {
          storage: diskStorage({
            destination: destinationDir,
            filename: (_, file, cb) => {
              const ext = extname(file.originalname).toLowerCase();
              cb(null, `${Date.now()}-${randomUUID()}${ext}`);
            },
          }),
          limits: { fileSize: upload.maxSizeMb * 1024 * 1024 },
          fileFilter: (_req, file, cb) => {
            if (upload.allowedMimetypes.includes(file.mimetype)) {
              cb(null, true);
            } else {
              // Must be an HttpException (not a bare Error) so the global
              // exception filter maps it to a proper 4xx instead of a 500.
              cb(
                new UnsupportedMediaTypeException(
                  `Unsupported file type "${file.mimetype}". Allowed: ${upload.allowedMimetypes.join(', ')}`,
                ),
                false,
              );
            }
          },
        };
      },
    }),
  ],
  controllers: [UploadsController],
  providers: [UploadsService],
  exports: [UploadsService],
})
export class UploadsModule {}
