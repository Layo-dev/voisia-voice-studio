-- Add RLS policy to profiles table to require authentication for SELECT
CREATE POLICY "Users must be authenticated to view profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (true);

-- Add RLS policies for storage.objects to allow users to access their own voiceover files
CREATE POLICY "Users can view their own voiceovers in storage"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'voiceovers' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can upload their own voiceovers to storage"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'voiceovers' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own voiceovers from storage"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'voiceovers' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);