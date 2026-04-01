
CREATE TABLE public.merry_go_round_cycles (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  chama_id uuid NOT NULL REFERENCES public.chamas(id) ON DELETE CASCADE,
  cycle_number integer NOT NULL,
  recipient_user_id uuid NOT NULL,
  amount numeric NOT NULL DEFAULT 0,
  payout_date date NOT NULL,
  status text NOT NULL DEFAULT 'upcoming',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(chama_id, cycle_number)
);

ALTER TABLE public.merry_go_round_cycles ENABLE ROW LEVEL SECURITY;

-- Members can view cycles for chamas they belong to
CREATE POLICY "Members view own chama cycles"
ON public.merry_go_round_cycles
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.chama_members cm
    WHERE cm.chama_id = merry_go_round_cycles.chama_id
      AND cm.user_id = auth.uid()
      AND cm.status = 'active'
  )
  OR has_role(auth.uid(), 'admin'::app_role)
);

-- Admins can manage cycles
CREATE POLICY "Admins manage cycles"
ON public.merry_go_round_cycles
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
