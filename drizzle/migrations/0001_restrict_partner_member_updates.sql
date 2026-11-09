REVOKE UPDATE ON public.retro_members FROM authenticated;
GRANT UPDATE (answers, display_name, updated_at) ON public.retro_members TO authenticated;