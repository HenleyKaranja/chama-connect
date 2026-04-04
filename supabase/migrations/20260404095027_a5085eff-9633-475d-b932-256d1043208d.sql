
CREATE TABLE public.investment_contributions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  chama_id UUID NOT NULL REFERENCES public.chamas(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL,
  payment_method TEXT DEFAULT 'mpesa',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.investment_contributions ENABLE ROW LEVEL SECURITY;

-- Users can view their own investment contributions
CREATE POLICY "Users view own investment contributions"
ON public.investment_contributions
FOR SELECT TO authenticated
USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role));

-- Users can create their own investment contributions
CREATE POLICY "Users can invest in projects"
ON public.investment_contributions
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Admins manage all
CREATE POLICY "Admins manage investment contributions"
ON public.investment_contributions
FOR ALL TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Function to update project current_amount on new investment
CREATE OR REPLACE FUNCTION public.update_project_amount()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE public.projects
  SET current_amount = current_amount + NEW.amount,
      updated_at = now()
  WHERE id = NEW.project_id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_investment_contribution
AFTER INSERT ON public.investment_contributions
FOR EACH ROW
EXECUTE FUNCTION public.update_project_amount();
