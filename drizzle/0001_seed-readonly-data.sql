INSERT INTO "notification_types" (
  "code",
  "name",
  "is_transactional",
  "is_active"
)
VALUES
  ('transactional', 'Transactional', true, true),
  ('marketing', 'Marketing', false, true)
ON CONFLICT ("code")
DO UPDATE SET
  "name" = EXCLUDED."name",
  "is_transactional" = EXCLUDED."is_transactional",
  "is_active" = EXCLUDED."is_active",
  "updated_at" = now();

--> statement-breakpoint

INSERT INTO "channels" (
  "code",
  "name",
  "is_active"
)
VALUES
  ('email', 'Email', true),
  ('sms', 'SMS', true),
  ('push', 'Push', true)
ON CONFLICT ("code")
DO UPDATE SET
  "name" = EXCLUDED."name",
  "is_active" = EXCLUDED."is_active",
  "updated_at" = now();

--> statement-breakpoint

INSERT INTO "default_preferences" (
  "notification_type_id",
  "channel_id",
  "enabled"
)
SELECT
  "notification_types"."id",
  "channels"."id",
  "seed"."enabled"
FROM (
  VALUES
    ('transactional', 'email', true),
    ('transactional', 'sms', true),
    ('transactional', 'push', true),
    ('marketing', 'email', false),
    ('marketing', 'sms', false),
    ('marketing', 'push', false)
) AS "seed" (
  "notification_type_code",
  "channel_code",
  "enabled"
)
JOIN "notification_types"
  ON "notification_types"."code" = "seed"."notification_type_code"
JOIN "channels"
  ON "channels"."code" = "seed"."channel_code"
ON CONFLICT (
  "notification_type_id",
  "channel_id"
)
DO UPDATE SET
  "enabled" = EXCLUDED."enabled",
  "updated_at" = now();

--> statement-breakpoint

INSERT INTO "global_policies" (
  "notification_type_id",
  "channel_id",
  "region",
  "decision",
  "reason"
)
SELECT
  "notification_types"."id",
  "channels"."id",
  "seed"."region",
  "seed"."decision",
  "seed"."reason"
FROM (
  VALUES
    (
      'marketing',
      'sms',
      'EU',
      'deny',
      'marketing_sms_blocked_in_eu'
    )
) AS "seed" (
  "notification_type_code",
  "channel_code",
  "region",
  "decision",
  "reason"
)
JOIN "notification_types"
  ON "notification_types"."code" = "seed"."notification_type_code"
JOIN "channels"
  ON "channels"."code" = "seed"."channel_code"
ON CONFLICT (
  "notification_type_id",
  "channel_id",
  "region",
  "decision",
  "reason"
)
DO UPDATE SET
  "updated_at" = now();
