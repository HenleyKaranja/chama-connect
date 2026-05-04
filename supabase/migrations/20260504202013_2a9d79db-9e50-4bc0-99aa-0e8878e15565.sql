ALTER TABLE public.contributions
ADD COLUMN approved_by uuid,
ADD COLUMN approved_at timestamp with time zone;
