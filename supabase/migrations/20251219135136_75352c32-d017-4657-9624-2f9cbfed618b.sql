-- Remove the overly permissive policy that allows any authenticated user to view all profiles
DROP POLICY IF EXISTS "Users must be authenticated to view profiles" ON public.profiles;