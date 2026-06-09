-- Update the handle_new_user function to use account_type from metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  account_type text;
  user_role app_role;
BEGIN
  -- Get account_type from metadata, default to 'customer'
  account_type := COALESCE(NEW.raw_user_meta_data->>'account_type', 'customer');
  
  -- Map account_type to app_role
  IF account_type = 'cleaner' THEN
    user_role := 'cleaner';
  ELSE
    user_role := 'customer';
  END IF;
  
  -- Create profile
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
  
  -- Assign role based on account_type
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, user_role);
  
  RETURN NEW;
END;
$function$;