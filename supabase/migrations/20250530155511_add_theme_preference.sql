-- Add theme preference to user_preferences
ALTER TABLE user_preferences
ADD COLUMN theme TEXT NOT NULL DEFAULT 'light';
