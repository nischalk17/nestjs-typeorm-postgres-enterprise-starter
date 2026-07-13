import {
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as fs from 'fs';
import * as path from 'path';
import { MediaTypeEnum } from 'src/common/enums';
import { In, Repository } from 'typeorm';
import { Media } from './entities/media.entity';

@Injectable()
export class UploadsService {
  constructor(
    @InjectRepository(Media)
    private readonly mediaRepository: Repository<Media>,
  ) {}

  async findOrFail(id: string) {
    const media = await this.mediaRepository.findOne({ where: { id } });
    if (!media) {
      throw new NotFoundException('Media not found');
    }
    return media;
  }

  /** Single reusable helper other modules can call to persist an uploaded file. */
  async saveFile(file: Express.Multer.File): Promise<Media> {
    const type = this.resolveMediaType(file.mimetype);
    const media = this.mediaRepository.create({
      type,
      url: `/uploads/${file.filename}`,
    });
    return this.mediaRepository.save(media);
  }

  async handleFileUpload(file: Express.Multer.File) {
    const media = await this.saveFile(file);
    return {
      message: 'File uploaded successfully',
      data: { id: media.id, type: media.type, url: media.url },
    };
  }

  async handleMultipleFileUpload(files: Array<Express.Multer.File>) {
    const data = await Promise.all(files.map((file) => this.saveFile(file)));
    return { message: 'Files uploaded successfully', data };
  }

  async removeMedia(id: string) {
    const media = await this.findOrFail(id);

    const filePath = path.join(process.cwd(), media.url);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    await this.mediaRepository.softDelete(media.id);
    return { message: 'Media deleted successfully', success: true };
  }

  async getByIds(ids: string[], failOn404: boolean = false) {
    const existingData = await this.mediaRepository.find({
      where: { id: In(ids) },
    });
    if (existingData.length !== ids.length && failOn404) {
      throw new NotFoundException('One or more media not found');
    }
    return existingData;
  }

  async getById(id: string) {
    return this.findOrFail(id);
  }

  private resolveMediaType(mimetype: string): MediaTypeEnum {
    if (mimetype.startsWith('image/')) return MediaTypeEnum.IMAGE;
    if (mimetype === 'application/pdf') return MediaTypeEnum.PDF;
    if (
      mimetype === 'application/msword' ||
      mimetype ===
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    )
      return MediaTypeEnum.DOCUMENT;

    throw new HttpException(
      'Unsupported file format! Only images, PDFs, and Word documents are allowed.',
      HttpStatus.BAD_REQUEST,
    );
  }
}
