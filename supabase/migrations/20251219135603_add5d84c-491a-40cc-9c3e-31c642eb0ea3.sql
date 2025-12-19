-- Deny anonymous access to profiles table
CREATE POLICY "Deny anonymous access to profiles" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

-- Deny anonymous access to subscriptions table
CREATE POLICY "Deny anonymous access to subscriptions" 
ON public.subscriptions 
FOR SELECT 
USING (auth.uid() IS NOT NULL);