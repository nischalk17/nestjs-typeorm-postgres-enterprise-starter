import { ApiProperty } from '@nestjs/swagger';
import { FileCategory } from 'src/common/enums';

export class MediaResponseDto {
  @ApiProperty({ example: '9', description: 'Positive numeric ID' })
  id!: string;

  @ApiProperty({
    example: 'http://localhost:9095/uploads/media/1752400000000-abc.png',
    description: 'Absolute, publicly accessible URL of the uploaded file',
  })
  url!: string;

  @ApiProperty({ example: 'onn.png' })
  originalName!: string;

  @ApiProperty({ example: 4479, description: 'File size in bytes' })
  fileSize!: number;

  @ApiProperty({
    example: 0,
    description: 'File size in megabytes, rounded to 2dp',
  })
  fileSizeMb!: number;

  @ApiProperty({ example: 'image/png' })
  mimeType!: string;

  @ApiProperty({ enum: FileCategory, example: FileCategory.IMAGE })
  fileCategory!: FileCategory;
}
