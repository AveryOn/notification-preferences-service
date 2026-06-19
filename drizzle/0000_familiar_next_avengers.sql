CREATE TYPE "public"."global_policy_decision" AS ENUM('allow', 'deny');--> statement-breakpoint
CREATE TYPE "public"."idempotency_status" AS ENUM('processing', 'completed');--> statement-breakpoint
CREATE TABLE "channels" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" varchar(100) NOT NULL,
	"name" varchar(255) NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "channels_code_unique" UNIQUE("code"),
	CONSTRAINT "channels_code_format_check" CHECK ("channels"."code" ~ '^[a-z0-9]+(?:_[a-z0-9]+)*$'),
	CONSTRAINT "channels_name_not_blank_check" CHECK (char_length(btrim("channels"."name")) > 0)
);
--> statement-breakpoint
CREATE TABLE "default_preferences" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"notification_type_id" uuid NOT NULL,
	"channel_id" uuid NOT NULL,
	"enabled" boolean NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "default_preferences_notification_type_channel_unique" UNIQUE("notification_type_id","channel_id")
);
--> statement-breakpoint
CREATE TABLE "global_policies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"notification_type_id" uuid,
	"channel_id" uuid,
	"region" varchar(100),
	"decision" "global_policy_decision" NOT NULL,
	"reason" varchar(255) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "global_policies_scope_unique" UNIQUE NULLS NOT DISTINCT("notification_type_id","channel_id","region"),
	CONSTRAINT "global_policies_region_not_blank_check" CHECK ("global_policies"."region" IS NULL OR char_length(btrim("global_policies"."region")) > 0),
	CONSTRAINT "global_policies_reason_not_blank_check" CHECK (char_length(btrim("global_policies"."reason")) > 0)
);
--> statement-breakpoint
CREATE TABLE "idempotency_records" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"operation" varchar(100) NOT NULL,
	"idempotency_key" varchar(255) NOT NULL,
	"request_hash" varchar(64) NOT NULL,
	"status" "idempotency_status" DEFAULT 'processing' NOT NULL,
	"response_status" integer,
	"response_body" jsonb,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "idempotency_records_scope_unique" UNIQUE("user_id","operation","idempotency_key")
);
--> statement-breakpoint
CREATE TABLE "notification_types" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" varchar(100) NOT NULL,
	"name" varchar(255) NOT NULL,
	"is_transactional" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "notification_types_code_unique" UNIQUE("code"),
	CONSTRAINT "notification_types_code_format_check" CHECK ("notification_types"."code" ~ '^[a-z0-9]+(?:_[a-z0-9]+)*$'),
	CONSTRAINT "notification_types_name_not_blank_check" CHECK (char_length(btrim("notification_types"."name")) > 0)
);
--> statement-breakpoint
CREATE TABLE "quiet_hours" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"start_time" time(0) NOT NULL,
	"end_time" time(0) NOT NULL,
	"timezone" varchar(255) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "quiet_hours_timezone_not_blank_check" CHECK (char_length(btrim("quiet_hours"."timezone")) > 0)
);
--> statement-breakpoint
CREATE TABLE "user_preferences" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"notification_type_id" uuid NOT NULL,
	"channel_id" uuid NOT NULL,
	"enabled" boolean NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "default_preferences" ADD CONSTRAINT "default_preferences_notification_type_id_notification_types_id_fk" FOREIGN KEY ("notification_type_id") REFERENCES "public"."notification_types"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "default_preferences" ADD CONSTRAINT "default_preferences_channel_id_channels_id_fk" FOREIGN KEY ("channel_id") REFERENCES "public"."channels"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "global_policies" ADD CONSTRAINT "global_policies_notification_type_id_notification_types_id_fk" FOREIGN KEY ("notification_type_id") REFERENCES "public"."notification_types"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "global_policies" ADD CONSTRAINT "global_policies_channel_id_channels_id_fk" FOREIGN KEY ("channel_id") REFERENCES "public"."channels"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "user_preferences" ADD CONSTRAINT "user_preferences_notification_type_id_notification_types_id_fk" FOREIGN KEY ("notification_type_id") REFERENCES "public"."notification_types"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "user_preferences" ADD CONSTRAINT "user_preferences_channel_id_channels_id_fk" FOREIGN KEY ("channel_id") REFERENCES "public"."channels"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
CREATE INDEX "idempotency_records_expires_at_index" ON "idempotency_records" USING btree ("expires_at");--> statement-breakpoint
CREATE UNIQUE INDEX "quiet_hours_user_unique" ON "quiet_hours" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "up_user_type_channel_unique" ON "user_preferences" USING btree ("user_id","notification_type_id","channel_id");