import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1700000000000 implements MigrationInterface {
  name = 'InitialSchema1700000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS pgcrypto`);
    await queryRunner.query(
      `CREATE TYPE "user_role_enum" AS ENUM ('STUDENT','OFFICER','SUPERVISOR','ENTERPRISE_REP')`,
    );
    await queryRunner.query(`CREATE TYPE "account_status_enum" AS ENUM ('ACTIVE','LOCKED')`);
    await queryRunner.query(
      `CREATE TYPE "profile_status_enum" AS ENUM ('DRAFT','SUBMITTED','NEEDS_REVISION','APPROVED','REJECTED')`,
    );
    await queryRunner.query(
      `CREATE TYPE "form_type_enum" AS ENUM ('ENTERPRISE','SUPERVISOR_PROCESS','SUPERVISOR_REPORT')`,
    );
    await queryRunner.query(`CREATE TYPE "submission_status_enum" AS ENUM ('DRAFT','SUBMITTED')`);
    await queryRunner.query(
      `CREATE TABLE "users" ("id" uuid PRIMARY KEY DEFAULT gen_random_uuid(), "email" varchar(320) NOT NULL UNIQUE, "password_hash" varchar(255) NOT NULL, "role" "user_role_enum" NOT NULL, "status" "account_status_enum" NOT NULL DEFAULT 'ACTIVE', "refresh_token_hash" varchar(255), "created_at" timestamptz NOT NULL DEFAULT now(), "updated_at" timestamptz NOT NULL DEFAULT now())`,
    );
    await queryRunner.query(
      `CREATE TABLE "students" ("user_id" uuid PRIMARY KEY REFERENCES "users"("id") ON DELETE RESTRICT, "student_code" varchar(50) NOT NULL UNIQUE, "full_name" varchar(200) NOT NULL, "phone" varchar(50), "major" varchar(255))`,
    );
    await queryRunner.query(
      `CREATE TABLE "officers" ("user_id" uuid PRIMARY KEY REFERENCES "users"("id") ON DELETE RESTRICT, "full_name" varchar(200) NOT NULL)`,
    );
    await queryRunner.query(
      `CREATE TABLE "supervisors" ("user_id" uuid PRIMARY KEY REFERENCES "users"("id") ON DELETE RESTRICT, "full_name" varchar(200) NOT NULL, "department" varchar(100))`,
    );
    await queryRunner.query(
      `CREATE TABLE "enterprises" ("id" uuid PRIMARY KEY DEFAULT gen_random_uuid(), "name" varchar(255) NOT NULL UNIQUE, "address" varchar(500), "phone" varchar(50), "website" varchar(255), "created_at" timestamptz NOT NULL DEFAULT now())`,
    );
    await queryRunner.query(
      `CREATE TABLE "enterprise_reps" ("user_id" uuid PRIMARY KEY REFERENCES "users"("id") ON DELETE RESTRICT, "enterprise_id" uuid NOT NULL REFERENCES "enterprises"("id") ON DELETE RESTRICT, "full_name" varchar(200) NOT NULL, "phone" varchar(50))`,
    );
    await queryRunner.query(
      `CREATE TABLE "internship_periods" ("id" uuid PRIMARY KEY DEFAULT gen_random_uuid(), "name" varchar(200) NOT NULL, "start_date" date NOT NULL, "end_date" date NOT NULL, "registration_open_at" timestamptz NOT NULL, "registration_close_at" timestamptz NOT NULL, "report_deadline" timestamptz, "active" boolean NOT NULL DEFAULT true, CONSTRAINT "ck_period_dates" CHECK ("start_date" <= "end_date"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "internship_profiles" ("id" uuid PRIMARY KEY DEFAULT gen_random_uuid(), "student_id" uuid NOT NULL REFERENCES "students"("user_id") ON DELETE RESTRICT, "period_id" uuid NOT NULL REFERENCES "internship_periods"("id") ON DELETE RESTRICT, "enterprise_id" uuid REFERENCES "enterprises"("id") ON DELETE RESTRICT, "supervisor_id" uuid REFERENCES "supervisors"("user_id") ON DELETE RESTRICT, "title" varchar(255) NOT NULL, "description" text, "status" "profile_status_enum" NOT NULL DEFAULT 'DRAFT', "last_status_reason" text, "created_at" timestamptz NOT NULL DEFAULT now(), "updated_at" timestamptz NOT NULL DEFAULT now(), UNIQUE ("student_id", "period_id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "status_histories" ("id" uuid PRIMARY KEY DEFAULT gen_random_uuid(), "profile_id" uuid NOT NULL REFERENCES "internship_profiles"("id") ON DELETE RESTRICT, "from_status" "profile_status_enum", "to_status" "profile_status_enum" NOT NULL, "changed_by" uuid NOT NULL REFERENCES "users"("id") ON DELETE RESTRICT, "reason" text, "created_at" timestamptz NOT NULL DEFAULT now())`,
    );
    await queryRunner.query(
      `CREATE TABLE "progress_updates" ("id" uuid PRIMARY KEY DEFAULT gen_random_uuid(), "profile_id" uuid NOT NULL REFERENCES "internship_profiles"("id") ON DELETE RESTRICT, "report_period" varchar(100) NOT NULL, "content" text NOT NULL, "created_by" uuid NOT NULL REFERENCES "users"("id") ON DELETE RESTRICT, "created_at" timestamptz NOT NULL DEFAULT now(), "updated_at" timestamptz NOT NULL DEFAULT now())`,
    );
    await queryRunner.query(
      `CREATE TABLE "comments" ("id" uuid PRIMARY KEY DEFAULT gen_random_uuid(), "profile_id" uuid NOT NULL REFERENCES "internship_profiles"("id") ON DELETE RESTRICT, "author_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE RESTRICT, "content" text NOT NULL, "created_at" timestamptz NOT NULL DEFAULT now())`,
    );
    await queryRunner.query(
      `CREATE TABLE "reports" ("id" uuid PRIMARY KEY DEFAULT gen_random_uuid(), "profile_id" uuid NOT NULL REFERENCES "internship_profiles"("id") ON DELETE RESTRICT, "version" integer NOT NULL, "storage_name" varchar(255) NOT NULL, "original_name" varchar(255) NOT NULL, "mime_type" varchar(100) NOT NULL, "size_bytes" bigint NOT NULL, "submitted_at" timestamptz NOT NULL DEFAULT now(), "is_late" boolean NOT NULL DEFAULT false, UNIQUE ("profile_id", "version"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "criteria" ("id" uuid PRIMARY KEY DEFAULT gen_random_uuid(), "period_id" uuid NOT NULL REFERENCES "internship_periods"("id") ON DELETE RESTRICT, "form_type" "form_type_enum" NOT NULL, "code" varchar(50) NOT NULL, "name" varchar(255) NOT NULL, "weight" numeric(8,5) NOT NULL CHECK ("weight" >= 0), "active" boolean NOT NULL DEFAULT true, UNIQUE ("period_id", "form_type", "code"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "evaluation_forms" ("id" uuid PRIMARY KEY DEFAULT gen_random_uuid(), "profile_id" uuid NOT NULL REFERENCES "internship_profiles"("id") ON DELETE RESTRICT, "form_type" "form_type_enum" NOT NULL, "evaluator_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE RESTRICT, "status" "submission_status_enum" NOT NULL DEFAULT 'DRAFT', "submitted_at" timestamptz, "created_at" timestamptz NOT NULL DEFAULT now(), "updated_at" timestamptz NOT NULL DEFAULT now(), UNIQUE ("profile_id", "form_type"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "evaluation_details" ("form_id" uuid NOT NULL REFERENCES "evaluation_forms"("id") ON DELETE RESTRICT, "criteria_id" uuid NOT NULL REFERENCES "criteria"("id") ON DELETE RESTRICT, "score" numeric(4,2) NOT NULL CHECK ("score" >= 0 AND "score" <= 10), "comment" text, PRIMARY KEY ("form_id", "criteria_id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "results" ("id" uuid PRIMARY KEY DEFAULT gen_random_uuid(), "profile_id" uuid NOT NULL UNIQUE REFERENCES "internship_profiles"("id") ON DELETE RESTRICT, "enterprise_score" numeric(5,2) NOT NULL, "supervisor_process_score" numeric(5,2) NOT NULL, "supervisor_report_score" numeric(5,2) NOT NULL, "total_score" numeric(5,2) NOT NULL, "is_finalized" boolean NOT NULL DEFAULT false, "published_at" timestamptz, "finalized_by" uuid REFERENCES "users"("id") ON DELETE RESTRICT, "created_at" timestamptz NOT NULL DEFAULT now())`,
    );
    await queryRunner.query(
      `CREATE TABLE "notifications" ("id" uuid PRIMARY KEY DEFAULT gen_random_uuid(), "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE RESTRICT, "title" varchar(255) NOT NULL, "content" text NOT NULL, "read_at" timestamptz, "created_at" timestamptz NOT NULL DEFAULT now())`,
    );
    await queryRunner.query(
      `CREATE TABLE "system_logs" ("id" uuid PRIMARY KEY DEFAULT gen_random_uuid(), "actor_id" uuid REFERENCES "users"("id") ON DELETE RESTRICT, "action" varchar(100) NOT NULL, "resource" varchar(100), "resource_id" uuid, "metadata" jsonb, "created_at" timestamptz NOT NULL DEFAULT now())`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    for (const table of [
      'system_logs',
      'notifications',
      'results',
      'evaluation_details',
      'evaluation_forms',
      'criteria',
      'reports',
      'comments',
      'progress_updates',
      'status_histories',
      'internship_profiles',
      'internship_periods',
      'enterprise_reps',
      'enterprises',
      'supervisors',
      'officers',
      'students',
      'users',
    ]) {
      await queryRunner.query(`DROP TABLE IF EXISTS "${table}"`);
    }
    for (const type of [
      'submission_status_enum',
      'form_type_enum',
      'profile_status_enum',
      'account_status_enum',
      'user_role_enum',
    ]) {
      await queryRunner.query(`DROP TYPE IF EXISTS "${type}"`);
    }
  }
}
