-- 1. Create app_role enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- 2. Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role public.app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE (user_id, role)
);

-- 3. Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 4. Create security definer function to check roles safely
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- 5. Rename users table to profiles and restructure
ALTER TABLE public.users RENAME TO profiles;

-- 6. Add user_id column to profiles (link to auth.users)
ALTER TABLE public.profiles ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- 7. Create unique constraint on user_id
ALTER TABLE public.profiles ADD CONSTRAINT profiles_user_id_key UNIQUE (user_id);

-- 8. Make email nullable (we'll get it from auth.users)
ALTER TABLE public.profiles ALTER COLUMN email DROP NOT NULL;

-- 9. Create function to auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, name, plan, credits)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', ''),
    'free',
    0
  );
  RETURN NEW;
END;
$$;

-- 10. Create trigger for auto-profile creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 11. RLS Policies for profiles
CREATE POLICY "Users can view their own profile"
  ON public.profiles
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all profiles"
  ON public.profiles
  FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update all profiles"
  ON public.profiles
  FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

-- 12. RLS Policies for voiceovers
ALTER TABLE public.voiceovers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own voiceovers"
  ON public.voiceovers
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own voiceovers"
  ON public.voiceovers
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own voiceovers"
  ON public.voiceovers
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own voiceovers"
  ON public.voiceovers
  FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all voiceovers"
  ON public.voiceovers
  FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- 13. RLS Policies for plans (public read)
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view plans"
  ON public.plans
  FOR SELECT
  USING (true);

-- 14. RLS Policies for subscriptions
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own subscriptions"
  ON public.subscriptions
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all subscriptions"
  ON public.subscriptions
  FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage subscriptions"
  ON public.subscriptions
  FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- 15. RLS Policy for user_roles (only admins can manage roles)
CREATE POLICY "Admins can manage user roles"
  ON public.user_roles
  FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));