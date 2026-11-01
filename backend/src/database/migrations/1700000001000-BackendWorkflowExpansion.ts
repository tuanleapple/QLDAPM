import { MigrationInterface, QueryRunner } from 'typeorm';

/** Adds the confirmed workflow fields while preserving all legacy form rows. */
export class BackendWorkflowExpansion1700000001000 implements MigrationInterface {
  name = 'BackendWorkflowExpansion1700000001000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "internship_periods" ADD "enterprise_weight" numeric(6,5) NOT NULL DEFAULT 0.4`,
    );
    await queryRunner.query(
      `ALTER TABLE "internship_periods" ADD "supervisor_process_weight" numeric(6,5) NOT NULL DEFAULT 0.3`,
    );
    await queryRunner.query(
      `ALTER TABLE "internship_periods" ADD "supervisor_report_weight" numeric(6,5) NOT NULL DEFAULT 0.3`,
    );
    await queryRunner.query(
      `ALTER TABLE "internship_periods" ADD CONSTRAINT "ck_period_weights" CHECK ("enterprise_weight" >= 0 AND "supervisor_process_weight" >= 0 AND "supervisor_report_weight" >= 0 AND "enterprise_weight" + "supervisor_process_weight" + "supervisor_report_weight" = 1)`,
    );
    await queryRunner.query(`ALTER TABLE "internship_profiles" ADD "position" varchar(255)`);
    await queryRunner.query(`ALTER TABLE "internship_profiles" ADD "internship_start_at" date`);
    await queryRunner.query(`ALTER TABLE "internship_profiles" ADD "internship_end_at" date`);

    // Rebuild enum columns to add REPORT_SUBMITTED without requiring a commit between DDL statements.
    await queryRunner.query(
      `CREATE TYPE "profile_status_enum_new" AS ENUM ('DRAFT','SUBMITTED','NEEDS_REVISION','APPROVED','REJECTED','REPORT_SUBMITTED')`,
    );
    await queryRunner.query(`ALTER TABLE "internship_profiles" ALTER COLUMN "status" DROP DEFAULT`);
    await queryRunner.query(
      `ALTER TABLE "internship_profiles" ALTER COLUMN "status" TYPE "profile_status_enum_new" USING "status"::text::"profile_status_enum_new"`,
    );
    await queryRunner.query(
      `ALTER TABLE "status_histories" ALTER COLUMN "from_status" TYPE "profile_status_enum_new" USING "from_status"::text::"profile_status_enum_new"`,
    );
    await queryRunner.query(
      `ALTER TABLE "status_histories" ALTER COLUMN "to_status" TYPE "profile_status_enum_new" USING "to_status"::text::"profile_status_enum_new"`,
    );
    await queryRunner.query(`DROP TYPE "profile_status_enum"`);
    await queryRunner.query(`ALTER TYPE "profile_status_enum_new" RENAME TO "profile_status_enum"`);
    await queryRunner.query(
      `ALTER TABLE "internship_profiles" ALTER COLUMN "status" SET DEFAULT 'DRAFT'`,
    );

    // Preserve old split supervisor forms under explicit legacy values. A human must reconcile
    // them before they can be represented as the new unified SUPERVISOR form.
    await queryRunner.query(
      `CREATE TYPE "form_type_enum_new" AS ENUM ('ENTERPRISE','SUPERVISOR','LEGACY_SUPERVISOR_PROCESS','LEGACY_SUPERVISOR_REPORT')`,
    );
    await queryRunner.query(
      `ALTER TABLE "criteria" ALTER COLUMN "form_type" TYPE "form_type_enum_new" USING (CASE "form_type"::text WHEN 'SUPERVISOR_PROCESS' THEN 'LEGACY_SUPERVISOR_PROCESS' WHEN 'SUPERVISOR_REPORT' THEN 'LEGACY_SUPERVISOR_REPORT' ELSE "form_type"::text END)::"form_type_enum_new"`,
    );
    await queryRunner.query(
      `ALTER TABLE "evaluation_forms" ALTER COLUMN "form_type" TYPE "form_type_enum_new" USING (CASE "form_type"::text WHEN 'SUPERVISOR_PROCESS' THEN 'LEGACY_SUPERVISOR_PROCESS' WHEN 'SUPERVISOR_REPORT' THEN 'LEGACY_SUPERVISOR_REPORT' ELSE "form_type"::text END)::"form_type_enum_new"`,
    );
    await queryRunner.query(`DROP TYPE "form_type_enum"`);
    await queryRunner.query(`ALTER TYPE "form_type_enum_new" RENAME TO "form_type_enum"`);
    await queryRunner.query(
      `CREATE TYPE "criteria_category_enum" AS ENUM ('ENTERPRISE','PROCESS','REPORT')`,
    );
    await queryRunner.query(
      `ALTER TABLE "criteria" ADD "category" "criteria_category_enum" NOT NULL DEFAULT 'ENTERPRISE'`,
    );
    await queryRunner.query(
      `UPDATE "criteria" SET "category" = CASE "form_type"::text WHEN 'LEGACY_SUPERVISOR_PROCESS' THEN 'PROCESS'::"criteria_category_enum" WHEN 'LEGACY_SUPERVISOR_REPORT' THEN 'REPORT'::"criteria_category_enum" ELSE 'ENTERPRISE'::"criteria_category_enum" END`,
    );
    await queryRunner.query(
      `ALTER TABLE "criteria" ADD CONSTRAINT "ck_criteria_form_category" CHECK (("form_type" = 'ENTERPRISE' AND "category" = 'ENTERPRISE') OR ("form_type" = 'SUPERVISOR' AND "category" IN ('PROCESS','REPORT')) OR ("form_type"::text LIKE 'LEGACY_SUPERVISOR_%'))`,
    );

    await queryRunner.query(
      `ALTER TABLE "progress_updates" RENAME COLUMN "content" TO "legacy_content"`,
    );
    // Keep historical text, but new progress records only write the structured fields below.
    await queryRunner.query(
      `ALTER TABLE "progress_updates" ALTER COLUMN "legacy_content" DROP NOT NULL`,
    );
    await queryRunner.query(`ALTER TABLE "progress_updates" ADD "work" text`);
    await queryRunner.query(`ALTER TABLE "progress_updates" ADD "outcome" text`);
    await queryRunner.query(`ALTER TABLE "progress_updates" ADD "difficulties" text`);
    await queryRunner.query(`UPDATE "progress_updates" SET "work" = "legacy_content"`);
    await queryRunner.query(
      `ALTER TABLE "comments" ADD "updated_at" timestamptz NOT NULL DEFAULT now()`,
    );

    await queryRunner.query(`ALTER TABLE "evaluation_forms" ADD "report_id" uuid`);
    await queryRunner.query(
      `ALTER TABLE "evaluation_forms" ADD CONSTRAINT "fk_eval_form_report" FOREIGN KEY ("report_id") REFERENCES "reports"("id") ON DELETE RESTRICT`,
    );
    await queryRunner.query(
      `ALTER TABLE "reports" ADD CONSTRAINT "ck_report_size" CHECK ("size_bytes" > 0 AND "size_bytes" <= 10485760) NOT VALID`,
    );

    await queryRunner.query(
      `ALTER TABLE "results" ALTER COLUMN "enterprise_score" TYPE numeric(12,8), ALTER COLUMN "supervisor_process_score" TYPE numeric(12,8), ALTER COLUMN "supervisor_report_score" TYPE numeric(12,8)`,
    );
    await queryRunner.query(`ALTER TABLE "results" ADD "calculated_total_score" numeric(12,8)`);
    await queryRunner.query(`ALTER TABLE "results" ADD "adjusted_total_score" numeric(5,2)`);
    await queryRunner.query(`ALTER TABLE "results" ADD "finalized_at" timestamptz`);
    await queryRunner.query(`UPDATE "results" SET "calculated_total_score" = "total_score"`);
    await queryRunner.query(
      `ALTER TABLE "results" ADD CONSTRAINT "ck_result_scores" CHECK ("total_score" BETWEEN 0 AND 10 AND ("calculated_total_score" IS NULL OR "calculated_total_score" BETWEEN 0 AND 10) AND ("adjusted_total_score" IS NULL OR "adjusted_total_score" BETWEEN 0 AND 10)) NOT VALID`,
    );
    await queryRunner.query(
      `CREATE TABLE "score_adjustments" ("id" uuid PRIMARY KEY DEFAULT gen_random_uuid(), "result_id" uuid NOT NULL REFERENCES "results"("id") ON DELETE RESTRICT, "old_score" numeric(5,2) NOT NULL CHECK ("old_score" BETWEEN 0 AND 10), "new_score" numeric(5,2) NOT NULL CHECK ("new_score" BETWEEN 0 AND 10), "reason" text NOT NULL, "changed_by" uuid NOT NULL REFERENCES "users"("id") ON DELETE RESTRICT, "created_at" timestamptz NOT NULL DEFAULT now())`,
    );
  }

  public async down(): Promise<void> {
    throw new Error(
      'This workflow migration is forward-only to protect historical evaluation and workflow data. Restore a verified backup or provide a separately reviewed data migration before rollback.',
    );
  }
}
