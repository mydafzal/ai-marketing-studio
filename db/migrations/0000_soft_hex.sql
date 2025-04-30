CREATE TABLE "persona_owners" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"persona_id" text NOT NULL,
	"owner_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "idx_persona_owners_persona_id" ON "persona_owners" USING btree ("persona_id");--> statement-breakpoint
CREATE INDEX "idx_persona_owners_owner_id" ON "persona_owners" USING btree ("owner_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_unique_persona_owner" ON "persona_owners" USING btree ("persona_id","owner_id");