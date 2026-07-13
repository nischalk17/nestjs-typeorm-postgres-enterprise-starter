import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MulterModule } from '@nestjs/platform-express';
import { TypeOrmModule } from '@nestjs/typeorm';
import { randomUUID } from 'crypto';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { Media } from './entities/media.entity';
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
        return {
          storage: diskStorage({
            destination: upload.dir,
            filename: (_, file, cb) => {
              const ext = extname(file.originalname).toLowerCase();
              cb(null, `${randomUUID()}${ext}`);
            },
          }),
          limits: { fileSize: upload.maxSizeMb * 1024 * 1024 },
          fileFilter: (_req, file, cb) => {
            if (upload.allowedMimetypes.includes(file.mimetype)) {
              cb(null, true);
            } else {
              cb(new Error('Unsupported file type'), false);
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
