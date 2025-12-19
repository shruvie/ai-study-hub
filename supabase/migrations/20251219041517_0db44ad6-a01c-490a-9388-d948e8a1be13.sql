-- Fix 1: Drop the overly permissive profiles policy
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;

-- Create a policy that only allows users to view their own profile
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT TO authenticated 
  USING (auth.uid() = user_id);

-- Create a security definer function for looking up users by email
-- This allows sharing notebooks without exposing all user data
CREATE OR REPLACE FUNCTION public.lookup_user_id_by_email(lookup_email TEXT)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  found_user_id UUID;
BEGIN
  -- Only allow authenticated users to call this function
  IF auth.uid() IS NULL THEN
    RETURN NULL;
  END IF;

  -- Look up the user_id for the given email
  SELECT user_id INTO found_user_id
  FROM public.profiles
  WHERE LOWER(email) = LOWER(lookup_email)
  LIMIT 1;

  RETURN found_user_id;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.lookup_user_id_by_email(TEXT) TO authenticated;