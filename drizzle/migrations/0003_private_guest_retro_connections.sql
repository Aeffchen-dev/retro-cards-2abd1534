CREATE TABLE public.retro_guest_sessions (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 invite_hash text NOT NULL UNIQUE,
 created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.retro_guest_sessions TO service_role;
ALTER TABLE public.retro_guest_sessions ENABLE ROW LEVEL SECURITY;
CREATE TABLE public.retro_guest_members (
 user_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 session_id uuid NOT NULL REFERENCES public.retro_guest_sessions(id) ON DELETE CASCADE,
 token_hash text NOT NULL UNIQUE,
 display_name text NOT NULL,
 is_owner boolean NOT NULL DEFAULT false,
 answers jsonb NOT NULL DEFAULT '{}'::jsonb,
 updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.retro_guest_members TO service_role;
ALTER TABLE public.retro_guest_members ENABLE ROW LEVEL SECURITY;
CREATE INDEX retro_guest_members_session_idx ON public.retro_guest_members(session_id);
COMMENT ON TABLE public.retro_guest_sessions IS 'Private guest rooms: service-role access only via capability-validating edge function; no public or authenticated direct reads.';
COMMENT ON TABLE public.retro_guest_members IS 'Guest identities are not auth users. Store only hashed 256-bit member capabilities; API never returns token hashes.';