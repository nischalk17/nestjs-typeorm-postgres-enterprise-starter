import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1752400000000 implements MigrationInterface {
  name = 'InitialSchema1752400000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."t_users_role_enum" AS ENUM('super_admin', 'admin', 'user')`,
    );
    await queryRunner.query(`
      CREATE TABLE "t_users" (
        "id" BIGSERIAL PRIMARY KEY,
        "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMP,
        "deleted_at" TIMESTAMP,
        "created_by" BIGINT,
        "updated_by" BIGINT,
        "status" BOOLEAN NOT NULL DEFAULT true,
        "fullname" VARCHAR(100) NOT NULL,
        "email" VARCHAR(255) NOT NULL,
        "password" TEXT NOT NULL,
        "hashed_refresh_token" TEXT,
        "role" "public"."t_users_role_enum" NOT NULL DEFAULT 'user',
        CONSTRAINT "UQ_t_users_email" UNIQUE ("email")
      )
    `);
    await queryRunner.query(
      `CREATE UNIQUE INDEX "idx_user_email" ON "t_users" ("email")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_user_role" ON "t_users" ("role")`,
    );

    await queryRunner.query(
      `CREATE TYPE "public"."t_media_media_type_enum" AS ENUM('video', 'image', 'document', 'pdf')`,
    );
    await queryRunner.query(`
      CREATE TABLE "t_media" (
        "id" BIGSERIAL PRIMARY KEY,
        "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMP,
        "deleted_at" TIMESTAMP,
        "created_by" BIGINT,
        "updated_by" BIGINT,
        "status" BOOLEAN NOT NULL DEFAULT true,
        "media_type" "public"."t_media_media_type_enum" NOT NULL,
        "url" VARCHAR(300) NOT NULL
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "t_media"`);
    await queryRunner.query(`DROP TYPE "public"."t_media_media_type_enum"`);

    await queryRunner.query(`DROP INDEX "public"."idx_user_role"`);
    await queryRunner.query(`DROP INDEX "public"."idx_user_email"`);
    await queryRunner.query(`DROP TABLE "t_users"`);
    await queryRunner.query(`DROP TYPE "public"."t_users_role_enum"`);
  }
}
