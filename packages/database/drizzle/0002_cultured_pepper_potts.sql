ALTER TABLE "outbox_events" ALTER COLUMN "payload" SET DATA TYPE jsonb
USING payload::jsonb;;