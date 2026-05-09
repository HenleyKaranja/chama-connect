-- 1. Chamas: penalty config
ALTER TABLE public.chamas
  ADD COLUMN IF NOT EXISTS penalty_amount numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS penalty_type text NOT NULL DEFAULT 'flat',
  ADD COLUMN IF NOT EXISTS penalty_grace_days integer NOT NULL DEFAULT 3;

-- 2. Penalties table
CREATE TABLE IF NOT EXISTS public.penalties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  chama_id uuid NOT NULL,
  contribution_id uuid,
  amount numeric NOT NULL DEFAULT 0,
  reason text NOT NULL DEFAULT 'Missed contribution',
  status text NOT NULL DEFAULT 'pending',
  due_date date,
  created_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz,
  resolved_by uuid
);

ALTER TABLE public.penalties ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own penalties"
  ON public.penalties FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins manage penalties"
  ON public.penalties FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can pay own penalties"
  ON public.penalties FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id AND status IN ('paid','pending'));

-- 3. Profiles: transaction PIN
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS transaction_pin_hash text,
  ADD COLUMN IF NOT EXISTS pin_set_at timestamptz,
  ADD COLUMN IF NOT EXISTS pin_attempts integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS pin_locked_until timestamptz;

-- 4. Login attempts
CREATE TABLE IF NOT EXISTS public.login_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  ip_address text,
  success boolean NOT NULL DEFAULT false,
  user_agent text,
  attempted_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_login_attempts_email_time
  ON public.login_attempts (email, attempted_at DESC);

ALTER TABLE public.login_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert login attempts"
  ON public.login_attempts FOR INSERT TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Anyone can read recent attempts for own email"
  ON public.login_attempts FOR SELECT TO anon, authenticated
  USING (true);

-- 5. User sessions / device management
CREATE TABLE IF NOT EXISTS public.user_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  device_label text,
  user_agent text,
  ip_address text,
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  revoked_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_user_sessions_user ON public.user_sessions (user_id, last_seen_at DESC);

ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own sessions"
  ON public.user_sessions FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Users insert own sessions"
  ON public.user_sessions FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own sessions"
  ON public.user_sessions FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users delete own sessions"
  ON public.user_sessions FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- 6. Cycle helpers
CREATE OR REPLACE FUNCTION public.has_active_cycle(_chama_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.merry_go_round_cycles
    WHERE chama_id = _chama_id
      AND status IN ('current','upcoming')
  );
$$;

CREATE OR REPLACE FUNCTION public.can_leave_chama(_user_id uuid, _chama_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT NOT public.has_active_cycle(_chama_id);
$$;

-- 7. Block member self-delete during active cycle (admins still manage via existing policy)
CREATE POLICY "Members can leave when no active cycle"
  ON public.chama_members FOR DELETE TO authenticated
  USING (
    auth.uid() = user_id
    AND public.can_leave_chama(auth.uid(), chama_id)
  );