-- Drop the overly permissive SELECT policy that allows any authenticated user to read all profiles
DROP POLICY IF EXISTS "Deny anonymous access to profiles" ON public.profiles;

-- Add proper delete policy for profile owners
CREATE POLICY "Users can delete their own profile" 
ON public.profiles 
FOR DELETE 
USING (auth.uid() = user_id);