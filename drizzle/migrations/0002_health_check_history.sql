CREATE TABLE public.retro_health_history (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 owner_id uuid NOT NULL,
 session_id uuid REFERENCES public.retro_sessions(id) ON DELETE SET NULL,
 recorded_at timestamptz NOT NULL DEFAULT now(),
 results jsonb NOT NULL CHECK (jsonb_typeof(results) = 'object')
);
GRANT SELECT, INSERT, DELETE ON public.retro_health_history TO authenticated;
GRANT ALL ON public.retro_health_history TO service_role;
ALTER TABLE public.retro_health_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY history_read ON public.retro_health_history FOR SELECT TO authenticated USING (owner_id = auth.uid() OR (session_id IS NOT NULL AND public.is_retro_member(session_id)));
CREATE POLICY history_insert ON public.retro_health_history FOR INSERT TO authenticated WITH CHECK (owner_id = auth.uid() AND (session_id IS NULL OR public.is_retro_member(session_id)));
CREATE POLICY history_delete ON public.retro_health_history FOR DELETE TO authenticated USING (owner_id = auth.uid());
CREATE INDEX retro_health_history_session_date ON public.retro_health_history(session_id, recorded_at);
CREATE INDEX retro_health_history_owner_date ON public.retro_health_history(owner_id, recorded_at);