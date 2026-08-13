CREATE TABLE IF NOT EXISTS "delivery_quotes" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "address_hash" text NOT NULL,
  "distance_km" numeric(10, 2) NOT NULL,
  "delivery_fee" numeric(10, 2) NOT NULL,
  "expires_at" timestamp NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "tracking_token_hash" text;
--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "tracking_token_expires_at" timestamp;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "orders_tracking_token_hash_unique" ON "orders" USING btree ("tracking_token_hash");
--> statement-breakpoint
ALTER TABLE "push_subscriptions" ADD COLUMN IF NOT EXISTS "role" text DEFAULT 'cliente' NOT NULL;
