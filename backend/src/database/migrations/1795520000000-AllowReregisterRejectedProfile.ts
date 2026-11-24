import { MigrationInterface, QueryRunner } from 'typeorm';

export class AllowReregisterRejectedProfile1795520000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Xóa UNIQUE constraint cũ
    await queryRunner.query(`
      ALTER TABLE "internship_profiles"
      DROP CONSTRAINT "internship_profiles_student_id_period_id_key";
    `);

    // 2. Tạo partial unique index mới
    await queryRunner.query(`
      CREATE UNIQUE INDEX
      "IDX_internship_profiles_student_period_not_rejected"
      ON "internship_profiles" ("student_id", "period_id")
      WHERE "status" <> 'REJECTED';
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // 1. Xóa partial unique index
    await queryRunner.query(`
      DROP INDEX IF EXISTS
      "IDX_internship_profiles_student_period_not_rejected";
    `);

    // 2. Khôi phục UNIQUE constraint cũ
    await queryRunner.query(`
      ALTER TABLE "internship_profiles"
      ADD CONSTRAINT "internship_profiles_student_id_period_id_key"
      UNIQUE ("student_id", "period_id");
    `);
  }
}
