-- Fix infinite recursion in notebooks policies
-- The issue is that "Users can view shared notebooks" policy queries notebook_permissions 
-- while notebook_permissions policies query notebooks, causing recursion

-- Drop the problematic policies
DROP POLICY IF EXISTS "Users can view shared notebooks" ON public.notebooks;
DROP POLICY IF EXISTS "Editors can update notebooks" ON public.notebooks;

-- Create a security definer function to check notebook access
CREATE OR REPLACE FUNCTION public.user_has_notebook_permission(p_notebook_id UUID, p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.notebook_permissions
    WHERE notebook_id = p_notebook_id AND user_id = p_user_id
  );
END;
$$;

-- Create function to check if user is editor
CREATE OR REPLACE FUNCTION public.user_is_notebook_editor(p_notebook_id UUID, p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.notebook_permissions
    WHERE notebook_id = p_notebook_id AND user_id = p_user_id AND role = 'editor'
  );
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.user_has_notebook_permission(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.user_is_notebook_editor(UUID, UUID) TO authenticated;

-- Recreate policies using the security definer functions
CREATE POLICY "Users can view shared notebooks" ON public.notebooks
  FOR SELECT TO authenticated 
  USING (public.user_has_notebook_permission(id, auth.uid()));

CREATE POLICY "Editors can update notebooks" ON public.notebooks
  FOR UPDATE TO authenticated 
  USING (public.user_is_notebook_editor(id, auth.uid()));