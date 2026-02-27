CREATE TABLE IF NOT EXISTS public.organization_member_notification_preference (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organization(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reservation_ops_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_org_member_notification_pref_org_user UNIQUE (organization_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_org_member_notification_pref_org_enabled
  ON public.organization_member_notification_preference(organization_id, reservation_ops_enabled);

CREATE INDEX IF NOT EXISTS idx_org_member_notification_pref_user
  ON public.organization_member_notification_preference(user_id);
