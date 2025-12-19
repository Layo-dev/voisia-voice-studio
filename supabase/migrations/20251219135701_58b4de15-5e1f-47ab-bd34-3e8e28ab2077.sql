-- Deny anonymous access to profiles for INSERT, UPDATE, DELETE
CREATE POLICY "Deny anonymous insert on profiles" 
ON public.profiles 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Deny anonymous update on profiles" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Deny anonymous delete on profiles" 
ON public.profiles 
FOR DELETE 
USING (auth.uid() IS NOT NULL);

-- Restrict plans table modifications to admins only
CREATE POLICY "Only admins can insert plans" 
ON public.plans 
FOR INSERT 
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can update plans" 
ON public.plans 
FOR UPDATE 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can delete plans" 
ON public.plans 
FOR DELETE 
USING (has_role(auth.uid(), 'admin'::app_role));