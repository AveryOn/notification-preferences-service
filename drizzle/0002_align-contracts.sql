CREATE TYPE "public"."global_policy_decision" AS ENUM('allow', 'deny');
--> statement-breakpoint
CREATE TYPE "public"."idempotency_status" AS ENUM('processing', 'completed');
--> statement-breakpoint
ALTER TABLE "channels"
  ALTER COLUMN "code" TYPE varchar(100),
  ALTER COLUMN "name" TYPE varchar(255);
--> statement-breakpoint
ALTER TABLE "channels"
  ADD CONSTRAINT "channels_code_format_check"
  CHECK ("channels"."code" ~ '^[a-z0-9]+(?:_[a-z0-9]+)*$'),
  ADD CONSTRAINT "channels_name_not_blank_check"
  CHECK (char_length(btrim("channels"."name")) > 0);
--> statement-breakpoint
ALTER TABLE "notification_types"
  ALTER COLUMN "code" TYPE varchar(100),
  ALTER COLUMN "name" TYPE varchar(255);
--> statement-breakpoint
ALTER TABLE "notification_types"
  ADD CONSTRAINT "notification_types_code_format_check"
  CHECK ("notification_types"."code" ~ '^[a-z0-9]+(?:_[a-z0-9]+)*$'),
  ADD CONSTRAINT "notification_types_name_not_blank_check"
  CHECK (char_length(btrim("notification_types"."name")) > 0);
--> statement-breakpoint
ALTER TABLE "user_preferences" ADD COLUMN "channel_id" uuid;
--> statement-breakpoint
UPDATE "user_preferences" AS "preference"
SET "channel_id" = "channel"."id"
FROM "channels" AS "channel"
WHERE "channel"."code" = "preference"."channel";
--> statement-breakpoint
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM "user_preferences"
    WHERE "channel_id" IS NULL
  ) THEN
    RAISE EXCEPTION 'Cannot migrate user_preferences.channel: unresolved channel code exists';
  END IF;
END
$$;
--> statement-breakpoint
DROP INDEX "up_user_type_channel_unique";
--> statement-breakpoint
ALTER TABLE "user_preferences"
  ALTER COLUMN "channel_id" SET NOT NULL,
  ADD CONSTRAINT "user_preferences_channel_id_channels_id_fk"
  FOREIGN KEY ("channel_id")
  REFERENCES "public"."channels"("id")
  ON DELETE restrict
  ON UPDATE cascade;
--> statement-breakpoint
ALTER TABLE "user_preferences" DROP COLUMN "channel";
--> statement-breakpoint
CREATE UNIQUE INDEX "up_user_type_channel_unique"
ON "user_preferences" USING btree (
  "user_id",
  "notification_type_id",
  "channel_id"
);
--> statement-breakpoint
WITH "ranked_policies" AS (
  SELECT
    "id",
    row_number() OVER (
      PARTITION BY
        "notification_type_id",
        "channel_id",
        "region"
      ORDER BY
        CASE WHEN "decision" = 'deny' THEN 0 ELSE 1 END,
        "updated_at" DESC,
        "created_at" DESC,
        "id"
    ) AS "position"
  FROM "global_policies"
)
DELETE FROM "global_policies" AS "policy"
USING "ranked_policies" AS "ranked"
WHERE "policy"."id" = "ranked"."id"
  AND "ranked"."position" > 1;
--> statement-breakpoint
ALTER TABLE "global_policies"
  DROP CONSTRAINT "global_policies_rule_unique";
--> statement-breakpoint
ALTER TABLE "global_policies"
  ALTER COLUMN "region" TYPE varchar(100),
  ALTER COLUMN "reason" TYPE varchar(255),
  ALTER COLUMN "decision" TYPE "public"."global_policy_decision"
    USING "decision"::"public"."global_policy_decision";
--> statement-breakpoint
ALTER TABLE "global_policies"
  ADD CONSTRAINT "global_policies_scope_unique"
  UNIQUE NULLS NOT DISTINCT (
    "notification_type_id",
    "channel_id",
    "region"
  ),
  ADD CONSTRAINT "global_policies_region_not_blank_check"
  CHECK (
    "global_policies"."region" IS NULL
    OR char_length(btrim("global_policies"."region")) > 0
  ),
  ADD CONSTRAINT "global_policies_reason_not_blank_check"
  CHECK (char_length(btrim("global_policies"."reason")) > 0);
--> statement-breakpoint
ALTER TABLE "idempotency_records"
  ALTER COLUMN "operation" TYPE varchar(100),
  ALTER COLUMN "idempotency_key" TYPE varchar(255),
  ALTER COLUMN "request_hash" TYPE varchar(64),
  ALTER COLUMN "status" DROP DEFAULT;
--> statement-breakpoint
ALTER TABLE "idempotency_records"
  ALTER COLUMN "status" TYPE "public"."idempotency_status"
    USING "status"::"public"."idempotency_status",
  ALTER COLUMN "status" SET DEFAULT 'processing';
--> statement-breakpoint
ALTER TABLE "quiet_hours"
  ALTER COLUMN "start_time" TYPE time(0),
  ALTER COLUMN "end_time" TYPE time(0),
  ALTER COLUMN "timezone" TYPE varchar(255);
--> statement-breakpoint
ALTER TABLE "quiet_hours"
  ADD CONSTRAINT "quiet_hours_timezone_not_blank_check"
  CHECK (char_length(btrim("quiet_hours"."timezone")) > 0);
