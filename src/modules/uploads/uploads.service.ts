import {
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import * as fs from 'fs';
import * as path from 'path';
import { FileCategory } from 'src/common/enums';
import { In, Repository } from 'typeorm';
import { MediaResponseDto } from './dto/media-response.dto';
import { MEDIA_SUBDIR } from './uploads.constants';
import { Media } from './entities/media.entity';

export type MediaResponse = MediaResponseDto;

@Injectable()
export class UploadsService {
  constructor(
    @InjectRepository(Media)
    private readonly mediaRepository: Repository<Media>,
    private readonly configService: ConfigService,
  ) {}

  async findOrFail(id: string): Promise<Media> {
    const media = await this.mediaRepository.findOne({ where: { id } });
    if (!media) {
      throw new NotFoundException('Media not found');
    }
    return media;
  }

  /** Single reusable helper other modules can call to persist an uploaded file. */
  async saveFile(file: Express.Multer.File): Promise<Media> {
    try {
      const fileCategory = this.resolveFileCategory(file.mimetype);
      const media = this.mediaRepository.create({
        fileCategory,
        url: `/uploads/${MEDIA_SUBDIR}/${file.filename}`,
        originalName: file.originalname,
        fileSize: file.size,
        mimeType: file.mimetype,
      });
      return await this.mediaRepository.save(media);
    } catch (error) {
      // Multer already wrote the file to disk by this point (fileFilter ran
      // before this method); if categorization or the DB write fails, remove
      // it instead of leaving an orphaned, DB-untracked file behind.
      if (fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }
      throw error;
    }
  }

  async handleFileUpload(file: Express.Multer.File): Promise<MediaResponse> {
    const media = await this.saveFile(file);
    return this.toResponse(media);
  }

  async handleMultipleFileUpload(
    files: Array<Express.Multer.File>,
  ): Promise<MediaResponse[]> {
    const saved = await Promise.all(files.map((file) => this.saveFile(file)));
    return saved.map((media) => this.toResponse(media));
  }

  async removeMedia(id: string): Promise<{ success: boolean }> {
    const media = await this.findOrFail(id);

    const filePath = this.resolvePhysicalPath(media);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    await this.mediaRepository.softDelete(media.id);
    return { success: true };
  }

  /**
   * `media.url` is a public URL path (always `/uploads/media/<file>`,
   * independent of storage location). The physical file, however, lives
   * under the configured `upload.dir` (UPLOAD_DIR), which may differ from
   * the default — resolve against that config, not `media.url` directly,
   * or deletes silently no-op when UPLOAD_DIR is customized.
   */
  private resolvePhysicalPath(media: Media): string {
    const uploadDir = this.configService.get<string>('upload.dir', './uploads');
    const filename = path.basename(media.url);
    return path.resolve(uploadDir, MEDIA_SUBDIR, filename);
  }

  async getByIds(ids: string[], failOn404 = false): Promise<Media[]> {
    const existingData = await this.mediaRepository.find({
      where: { id: In(ids) },
    });
    if (existingData.length !== ids.length && failOn404) {
      throw new NotFoundException('One or more media not found');
    }
    return existingData;
  }

  async getById(id: string): Promise<MediaResponse> {
    return this.toResponse(await this.findOrFail(id));
  }

  private toResponse(media: Media): MediaResponse {
    const baseUrl = this.configService.get<string>('app.baseUrl', '');
    return {
      id: media.id,
      url: `${baseUrl}${media.url}`,
      originalName: media.originalName,
      fileSize: media.fileSize,
      fileSizeMb: Math.round((media.fileSize / (1024 * 1024)) * 100) / 100,
      mimeType: media.mimeType,
      fileCategory: media.fileCategory,
    };
  }

  private resolveFileCategory(mimetype: string): FileCategory {
    if (mimetype.startsWith('image/')) return FileCategory.IMAGE;
    if (mimetype.startsWith('video/')) return FileCategory.VIDEO;
    if (mimetype.startsWith('audio/')) return FileCategory.AUDIO;
    if (
      mimetype === 'application/pdf' ||
      mimetype === 'application/msword' ||
      mimetype ===
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    )
      return FileCategory.DOCUMENT;

    // Reachable if UPLOAD_ALLOWED_MIMETYPES is extended with a type not
    // categorized above — keep this in sync with FileCategory whenever the
    // allowlist grows.
    throw new HttpException(
      `Unrecognized media category for MIME type "${mimetype}".`,
      HttpStatus.BAD_REQUEST,
    );
  }
}
