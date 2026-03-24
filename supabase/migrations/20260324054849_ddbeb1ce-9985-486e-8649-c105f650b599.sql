CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  selected_role app_role;
BEGIN
  INSERT INTO public.profiles (user_id, full_name, phone)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'phone', NULL)
  );

  IF NEW.raw_user_meta_data->>'role' = 'admin' THEN
    selected_role := 'admin';
  ELSE
    selected_role := 'member';
  END IF;

  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, selected_role);

  RETURN NEW;
END;
$function$;