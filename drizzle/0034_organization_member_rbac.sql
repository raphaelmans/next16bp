DO $$ BEGIN
  CREATE TYPE organization_member_role AS ENUM ('OWNER', 'MANAGER', 'VIEWER');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE organization_member_status AS ENUM ('ACTIVE', 'REVOKED');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE organization_invitation_status AS ENUM (
    'PENDING',
    'ACCEPTED',
    'DECLINED',
    'CANCELED',
    'EXPIRED'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS public.organization_member (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organization(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role organization_member_role NOT NULL,
  permissions JSONB NOT NULL,
  status organization_member_status NOT NULL DEFAULT 'ACTIVE',
  invited_by_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  joined_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_organization_member_org_user UNIQUE (organization_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_organization_member_org_status
  ON public.organization_member(organization_id, status);
CREATE INDEX IF NOT EXISTS idx_organization_member_user_status
  ON public.organization_member(user_id, status);

CREATE TABLE IF NOT EXISTS public.organization_invitation (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organization(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  role organization_member_role NOT NULL,
  permissions JSONB NOT NULL,
  token_hash VARCHAR(128) NOT NULL,
  status organization_invitation_status NOT NULL DEFAULT 'PENDING',
  expires_at TIMESTAMPTZ NOT NULL,
  invited_by_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  accepted_by_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_organization_invitation_token_hash UNIQUE (token_hash)
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_organization_invitation_pending_org_email
  ON public.organization_invitation(organization_id, email)
  WHERE status = 'PENDING';

CREATE INDEX IF NOT EXISTS idx_organization_invitation_org_status
  ON public.organization_invitation(organization_id, status);
CREATE INDEX IF NOT EXISTS idx_organization_invitation_expires_at
  ON public.organization_invitation(expires_at);
