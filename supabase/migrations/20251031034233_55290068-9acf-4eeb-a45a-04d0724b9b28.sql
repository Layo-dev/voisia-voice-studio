-- Make user_id columns NOT NULL to prevent data integrity issues
-- These columns are critical for RLS policies that check auth.uid() = user_id

ALTER TABLE public.profiles ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.subscriptions ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.voiceovers ALTER COLUMN user_id SET NOT NULL;