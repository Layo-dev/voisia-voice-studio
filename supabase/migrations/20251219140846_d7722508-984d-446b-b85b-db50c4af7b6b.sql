-- Restrict subscriptions INSERT, UPDATE, DELETE to admins only
CREATE POLICY "Only admins can insert subscriptions" 
ON public.subscriptions 
FOR INSERT 
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can update subscriptions" 
ON public.subscriptions 
FOR UPDATE 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can delete subscriptions" 
ON public.subscriptions 
FOR DELETE 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Deny anonymous insert on voiceovers
CREATE POLICY "Deny anonymous insert on voiceovers" 
ON public.voiceovers 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);