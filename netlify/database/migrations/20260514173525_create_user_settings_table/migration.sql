CREATE TABLE "user_settings" (
	"id" serial PRIMARY KEY,
	"user_id" text NOT NULL UNIQUE,
	"saved_accounts" jsonb DEFAULT '[]',
	"prop_settings" jsonb DEFAULT '{}',
	"trade_history" jsonb DEFAULT '[]',
	"meta_token" text DEFAULT '',
	"preferences" jsonb DEFAULT '{}',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
