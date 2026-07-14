import {
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  UploadedFile,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiUnsupportedMediaTypeResponse,
} from '@nestjs/swagger';
import { MediaResponseDto } from './dto/media-response.dto';
import { UploadsService } from './uploads.service';

@ApiTags('Uploads')
@ApiBearerAuth()
@Controller({ path: 'uploads', version: '1' })
export class UploadsController {
  constructor(private readonly uploadsService: UploadsService) {}

  @ApiOperation({
    summary: 'Upload a single file',
    description:
      'Accepts one multipart file. Rejects unsupported MIME types (415) or files exceeding UPLOAD_MAX_SIZE_MB (400).',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: { file: { type: 'string', format: 'binary' } },
      required: ['file'],
    },
  })
  @ApiCreatedResponse({
    description: 'File uploaded and persisted.',
    type: MediaResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'File too large or malformed request.',
  })
  @ApiUnsupportedMediaTypeResponse({ description: 'MIME type not allowed.' })
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(FileInterceptor('file'))
  uploadFile(@UploadedFile() file: Express.Multer.File) {
    return this.uploadsService.handleFileUpload(file);
  }

  @ApiOperation({
    summary: 'Upload up to 10 files at once',
    description:
      'Accepts multiple multipart files (max 10). Each file is validated independently; if one fails, files already persisted before it are NOT rolled back.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        files: {
          type: 'array',
          items: { type: 'string', format: 'binary' },
        },
      },
      required: ['files'],
    },
  })
  @ApiCreatedResponse({
    description: 'Files uploaded and persisted.',
    type: MediaResponseDto,
    isArray: true,
  })
  @ApiBadRequestResponse({ description: 'A file was too large or malformed.' })
  @ApiUnsupportedMediaTypeResponse({
    description: 'A MIME type was not allowed.',
  })
  @Post('bulk')
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(FilesInterceptor('files', 10))
  uploadMultipleFile(@UploadedFiles() files: Array<Express.Multer.File>) {
    return this.uploadsService.handleMultipleFileUpload(files);
  }

  @ApiOperation({ summary: 'Get media metadata by ID' })
  @ApiParam({ name: 'id', example: '9' })
  @ApiOkResponse({ description: 'Media found.', type: MediaResponseDto })
  @ApiNotFoundResponse({ description: 'Media not found or already deleted.' })
  @Get(':id')
  getById(@Param('id') id: string) {
    return this.uploadsService.getById(id);
  }

  @ApiOperation({
    summary: 'Delete media by ID',
    description:
      'Soft-deletes the DB record and removes the physical file from disk.',
  })
  @ApiParam({ name: 'id', example: '9' })
  @ApiOkResponse({ description: 'Media deleted.' })
  @ApiNotFoundResponse({ description: 'Media not found or already deleted.' })
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  remove(@Param('id') id: string) {
    return this.uploadsService.removeMedia(id);
  }
}
