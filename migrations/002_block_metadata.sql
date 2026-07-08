-- Adds a generic metadata column to blocks so Tier 0 block types that need
-- more than title/url (FAQ items, vCard fields, free-text body) don't each
-- need their own table. Matches the original build spec's own suggestion:
-- "platform + value + maybe metadata JSONB".
BEGIN;

ALTER TABLE blocks ADD COLUMN IF NOT EXISTS metadata JSONB NOT NULL DEFAULT '{}';

COMMIT;
