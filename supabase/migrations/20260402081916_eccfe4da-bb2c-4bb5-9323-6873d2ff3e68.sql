ALTER TABLE public.projects ADD COLUMN chama_id uuid REFERENCES public.chamas(id) ON DELETE CASCADE;

DROP POLICY IF EXISTS "Authenticated can view projects" ON public.projects;

CREATE POLICY "Members view chama projects"
ON public.projects
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.chama_members cm
    WHERE cm.chama_id = projects.chama_id
      AND cm.user_id = auth.uid()
      AND cm.status = 'active'
  )
  OR has_role(auth.uid(), 'admin'::app_role)
);