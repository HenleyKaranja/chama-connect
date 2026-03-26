
-- Notifications table
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  type text NOT NULL DEFAULT 'info',
  is_read boolean NOT NULL DEFAULT false,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own notifications" ON public.notifications
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications" ON public.notifications
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert notifications" ON public.notifications
  FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "Admins manage all notifications" ON public.notifications
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Enable realtime for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- Function to notify all chama members about an event
CREATE OR REPLACE FUNCTION public.notify_chama_members(
  _chama_id uuid,
  _title text,
  _message text,
  _type text DEFAULT 'info',
  _exclude_user_id uuid DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.notifications (user_id, title, message, type, metadata)
  SELECT cm.user_id, _title, _message, _type, jsonb_build_object('chama_id', _chama_id)
  FROM public.chama_members cm
  WHERE cm.chama_id = _chama_id
    AND cm.status = 'active'
    AND (_exclude_user_id IS NULL OR cm.user_id != _exclude_user_id);
END;
$$;

-- Function to notify all members (system-wide)
CREATE OR REPLACE FUNCTION public.notify_all_members(
  _title text,
  _message text,
  _type text DEFAULT 'info'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.notifications (user_id, title, message, type)
  SELECT p.user_id, _title, _message, _type
  FROM public.profiles p
  WHERE p.is_approved = true;
END;
$$;
