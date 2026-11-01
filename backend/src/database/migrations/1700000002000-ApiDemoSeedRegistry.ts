import { MigrationInterface, QueryRunner } from 'typeorm';

/** Stores the original time anchor for deterministic, append-only API demo fixtures. */
export class ApiDemoSeedRegistry1700000002000 implements MigrationInterface {
  name = 'ApiDemoSeedRegistry1700000002000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "api_demo_seed_runs" (
        "seed_key" varchar(100) PRIMARY KEY,
        "seed_version" integer NOT NULL CHECK ("seed_version" > 0),
        "seeded_at" timestamptz NOT NULL DEFAULT now(),
        "manifest" jsonb NOT NULL DEFAULT '{}'::jsonb
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const rows = (await queryRunner.query(
      `SELECT 1 FROM "api_demo_seed_runs" WHERE "seed_key" = 'student-internship-api-demo' LIMIT 1`,
    )) as unknown[];
    if (rows.length) {
      throw new Error(
        'Cannot remove the demo seed time anchor after fixtures exist; create a fresh local database instead.',
      );
    }
    await queryRunner.query(`DROP TABLE "api_demo_seed_runs"`);
  }
}
