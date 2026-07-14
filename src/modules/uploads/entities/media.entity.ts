import { CommonFields } from 'src/common/base.entity';
import { FileCategory } from 'src/common/enums';
import { Column, Entity } from 'typeorm';

@Entity('t_media')
export class Media extends CommonFields {
  // Plain varchar (not a Postgres enum type) so adding new categories never
  // requires an `ALTER TYPE ... ADD VALUE` migration.
  @Column({ type: 'varchar', length: 20, name: 'file_category' })
  fileCategory!: FileCategory;

  /** Path relative to the server root, e.g. `/uploads/media/<file>`. The
   * absolute URL is built on read from `app.baseUrl` so it stays portable
   * across environments/hosts. */
  @Column({ type: 'varchar', length: 300, name: 'url' })
  url!: string;

  @Column({ type: 'varchar', length: 255, name: 'original_name' })
  originalName!: string;

  @Column({ type: 'int', name: 'file_size' })
  fileSize!: number;

  @Column({ type: 'varchar', length: 100, name: 'mime_type' })
  mimeType!: string;
}
