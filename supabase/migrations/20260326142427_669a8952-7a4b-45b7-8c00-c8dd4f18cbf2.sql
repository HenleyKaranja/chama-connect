
-- Chamas table
CREATE TABLE public.chamas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  contribution_amount numeric NOT NULL DEFAULT 0,
  contribution_frequency text NOT NULL DEFAULT 'monthly',
  total_savings numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Chama members (join table)
CREATE TABLE public.chama_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chama_id uuid REFERENCES public.chamas(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  joined_at timestamptz NOT NULL DEFAULT now(),
  status text NOT NULL DEFAULT 'active',
  UNIQUE(chama_id, user_id)
);

-- Contributions
CREATE TABLE public.contributions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  chama_id uuid REFERENCES public.chamas(id) ON DELETE CASCADE NOT NULL,
  amount numeric NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  payment_method text DEFAULT 'mpesa',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Loans
CREATE TABLE public.loans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  chama_id uuid REFERENCES public.chamas(id) ON DELETE CASCADE NOT NULL,
  amount numeric NOT NULL,
  interest_rate numeric NOT NULL DEFAULT 10,
  status text NOT NULL DEFAULT 'pending',
  approved_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  approved_at timestamptz,
  due_date timestamptz,
  repaid_amount numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Wallets
CREATE TABLE public.wallets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  balance numeric NOT NULL DEFAULT 0,
  total_contributed numeric NOT NULL DEFAULT 0,
  total_withdrawn numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Wallet transactions
CREATE TABLE public.wallet_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_id uuid REFERENCES public.wallets(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type text NOT NULL,
  amount numeric NOT NULL,
  description text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Updated_at triggers
CREATE TRIGGER update_chamas_updated_at BEFORE UPDATE ON public.chamas FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_contributions_updated_at BEFORE UPDATE ON public.contributions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_loans_updated_at BEFORE UPDATE ON public.loans FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_wallets_updated_at BEFORE UPDATE ON public.wallets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS on all tables
ALTER TABLE public.chamas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chama_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;

-- CHAMAS: all authenticated can view, admins manage
CREATE POLICY "Authenticated can view chamas" ON public.chamas FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage chamas" ON public.chamas FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));

-- CHAMA_MEMBERS: users see own memberships, admins see all
CREATE POLICY "Users view own memberships" ON public.chama_members FOR SELECT TO authenticated USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage memberships" ON public.chama_members FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can join chamas" ON public.chama_members FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- CONTRIBUTIONS: users see own, admins see all
CREATE POLICY "Users view own contributions" ON public.contributions FOR SELECT TO authenticated USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can create own contributions" ON public.contributions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins manage contributions" ON public.contributions FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));

-- LOANS: users see own, admins see all
CREATE POLICY "Users view own loans" ON public.loans FOR SELECT TO authenticated USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can apply for loans" ON public.loans FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins manage loans" ON public.loans FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));

-- WALLETS: users see own, admins see all
CREATE POLICY "Users view own wallet" ON public.wallets FOR SELECT TO authenticated USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'));
CREATE POLICY "System can create wallets" ON public.wallets FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins manage wallets" ON public.wallets FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));

-- WALLET_TRANSACTIONS: users see own, admins see all
CREATE POLICY "Users view own transactions" ON public.wallet_transactions FOR SELECT TO authenticated USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can create own transactions" ON public.wallet_transactions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins manage transactions" ON public.wallet_transactions FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));

-- Auto-create wallet on user signup (add to handle_new_user)
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

  INSERT INTO public.wallets (user_id) VALUES (NEW.id);

  RETURN NEW;
END;
$function$;

-- Enable realtime for key tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.contributions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.loans;
