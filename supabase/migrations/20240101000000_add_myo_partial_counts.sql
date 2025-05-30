-- Add columns for counting myo-reps and partials
ALTER TABLE sets_logged 
ADD COLUMN myo_rep_count INTEGER DEFAULT 0,
ADD COLUMN partial_count INTEGER DEFAULT 0;

-- Add comments for clarity
COMMENT ON COLUMN sets_logged.myo_rep_count IS 'Number of myo-reps performed after the main set';
COMMENT ON COLUMN sets_logged.partial_count IS 'Number of partial reps performed in the set';

-- Update existing rows to have 0 counts
UPDATE sets_logged 
SET myo_rep_count = 0, partial_count = 0 
WHERE myo_rep_count IS NULL OR partial_count IS NULL; 