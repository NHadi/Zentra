-- Drop existing sequence if it exists
DROP SEQUENCE IF EXISTS master_division_id_seq;

-- Create new sequence
CREATE SEQUENCE master_division_id_seq;

-- Alter the table to use the sequence
ALTER TABLE master_division ALTER COLUMN id SET DEFAULT nextval('master_division_id_seq');

-- Set sequence owner
ALTER SEQUENCE master_division_id_seq OWNED BY master_division.id;

-- Reset sequence to max id + 1
SELECT setval('master_division_id_seq', COALESCE((SELECT MAX(id) FROM master_division), 0) + 1, false); 