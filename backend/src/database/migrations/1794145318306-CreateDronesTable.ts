import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateDronesTable1794145318306 implements MigrationInterface {
  name = 'CreateDronesTable1794145318306';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "drones" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "latitude" double precision NOT NULL, "longitude" double precision NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "CHK_drones_longitude_range" CHECK ("longitude" BETWEEN -180 AND 180), CONSTRAINT "CHK_drones_latitude_range" CHECK ("latitude" BETWEEN -90 AND 90), CONSTRAINT "PK_drones" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_drones_created_at" ON "drones"  ("created_at") `,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."IDX_drones_created_at"`);
    await queryRunner.query(`DROP TABLE "drones"`);
  }
}
