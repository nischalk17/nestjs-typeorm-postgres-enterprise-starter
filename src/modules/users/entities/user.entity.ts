import { Exclude } from 'class-transformer';
import { CommonFields } from 'src/common/base.entity';
import { UserRoleENUM } from 'src/common/enums';
import { Column, Entity, Index } from 'typeorm';

@Entity('t_users')
export class User extends CommonFields {
  @Column({ nullable: false, type: 'varchar', length: 100 })
  fullname!: string;

  // Uniqueness is enforced solely by the explicit `idx_user_email` index
  // below — do not also set `unique: true` here, or TypeORM's schema sync/
  // migration-generation will see two separate unique constraints on the
  // same column (one auto-named `UQ_...`, one this named index) and drift.
  @Index('idx_user_email', { unique: true })
  @Column({ nullable: false, type: 'varchar', length: 255 })
  email!: string;

  // `select: false` keeps it out of default queries; `@Exclude()` is defense
  // in depth so it can never leak even if a query explicitly selects it and
  // the entity is serialized via the global ClassSerializerInterceptor.
  @Exclude()
  @Column({ nullable: false, type: 'text', select: false })
  password!: string;

  @Exclude()
  @Column({
    name: 'hashed_refresh_token',
    type: 'text',
    nullable: true,
    select: false,
  })
  hashedRefreshToken?: string | null;

  @Index('idx_user_role')
  @Column({
    type: 'enum',
    enum: UserRoleENUM,
    default: UserRoleENUM.USER,
  })
  role!: UserRoleENUM;
}
