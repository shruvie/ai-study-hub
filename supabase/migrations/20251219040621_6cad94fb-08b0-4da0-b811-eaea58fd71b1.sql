-- Create app role enum for permissions
CREATE TYPE public.permission_role AS ENUM ('viewer', 'editor');

-- Create profiles table for user info
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create notebooks table
CREATE TABLE public.notebooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'Untitled Notebook',
  content_json JSONB DEFAULT '{}'::jsonb,
  file_urls TEXT[] DEFAULT '{}',
  source_type TEXT,
  source_content TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create permissions table for sharing
CREATE TABLE public.notebook_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  notebook_id UUID NOT NULL REFERENCES public.notebooks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role permission_role NOT NULL DEFAULT 'viewer',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(notebook_id, user_id)
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notebooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notebook_permissions ENABLE ROW LEVEL SECURITY;

-- Enable realtime for notebooks and permissions
ALTER PUBLICATION supabase_realtime ADD TABLE public.notebooks;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notebook_permissions;

-- Profiles policies
CREATE POLICY "Users can view all profiles" ON public.profiles
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Notebooks policies
CREATE POLICY "Users can view own notebooks" ON public.notebooks
  FOR SELECT TO authenticated USING (owner_id = auth.uid());

CREATE POLICY "Users can view shared notebooks" ON public.notebooks
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.notebook_permissions
      WHERE notebook_id = notebooks.id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create own notebooks" ON public.notebooks
  FOR INSERT TO authenticated WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Owners can update notebooks" ON public.notebooks
  FOR UPDATE TO authenticated USING (owner_id = auth.uid());

CREATE POLICY "Editors can update notebooks" ON public.notebooks
  FOR UPDATE TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.notebook_permissions
      WHERE notebook_id = notebooks.id AND user_id = auth.uid() AND role = 'editor'
    )
  );

CREATE POLICY "Owners can delete notebooks" ON public.notebooks
  FOR DELETE TO authenticated USING (owner_id = auth.uid());

-- Notebook permissions policies
CREATE POLICY "Owners can manage permissions" ON public.notebook_permissions
  FOR ALL TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.notebooks
      WHERE id = notebook_permissions.notebook_id AND owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can view permissions they have" ON public.notebook_permissions
  FOR SELECT TO authenticated USING (user_id = auth.uid());

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, display_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.raw_user_meta_data ->> 'name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data ->> 'avatar_url'
  );
  RETURN NEW;
END;
$$;

-- Trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Triggers for automatic timestamp updates
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_notebooks_updated_at
  BEFORE UPDATE ON public.notebooks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();