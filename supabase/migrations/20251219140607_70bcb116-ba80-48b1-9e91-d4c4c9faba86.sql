-- Add PERMISSIVE policy to block anonymous reads on profiles
-- This ensures only authenticated users can query the table
CREATE POLICY "Block anonymous reads on profiles" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role));

-- Fix subscriptions table - add proper PERMISSIVE policy for authenticated users
DROP POLICY IF EXISTS "Deny anonymous access to subscriptions" ON public.subscriptions;

CREATE POLICY "Authenticated users view own subscriptions" 
ON public.subscriptions 
FOR SELECT 
TO authenticated
USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role));