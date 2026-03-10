CREATE TABLE IF NOT EXISTS public.developer_integration (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organization(id) ON DELETE CASCADE,
  name VARCHAR(160) NOT NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'ACTIVE',
  created_by_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_developer_integration_org_status
  ON public.developer_integration(organization_id, status);

CREATE TABLE IF NOT EXISTS public.developer_api_key (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  integration_id UUID NOT NULL REFERENCES public.developer_integration(id) ON DELETE CASCADE,
  name VARCHAR(160) NOT NULL,
  key_prefix VARCHAR(64) NOT NULL,
  secret_hash VARCHAR(64) NOT NULL,
  last_four VARCHAR(4) NOT NULL,
  scopes JSONB NOT NULL DEFAULT '[]'::jsonb,
  allowed_ip_cidrs JSONB NOT NULL DEFAULT '[]'::jsonb,
  status VARCHAR(32) NOT NULL DEFAULT 'ACTIVE',
  expires_at TIMESTAMPTZ,
  last_used_at TIMESTAMPTZ,
  last_used_ip VARCHAR(64),
  revoked_at TIMESTAMPTZ,
  created_by_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_developer_api_key_prefix
  ON public.developer_api_key(key_prefix);
CREATE UNIQUE INDEX IF NOT EXISTS uq_developer_api_key_secret_hash
  ON public.developer_api_key(secret_hash);
CREATE INDEX IF NOT EXISTS idx_developer_api_key_integration_status
  ON public.developer_api_key(integration_id, status);

CREATE TABLE IF NOT EXISTS public.developer_court_mapping (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  integration_id UUID NOT NULL REFERENCES public.developer_integration(id) ON DELETE CASCADE,
  court_id UUID NOT NULL REFERENCES public.court(id) ON DELETE CASCADE,
  external_court_id VARCHAR(128) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_developer_court_mapping_external
  ON public.developer_court_mapping(integration_id, external_court_id);
CREATE UNIQUE INDEX IF NOT EXISTS uq_developer_court_mapping_court
  ON public.developer_court_mapping(integration_id, court_id);

CREATE TABLE IF NOT EXISTS public.developer_unavailability_sync (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  integration_id UUID NOT NULL REFERENCES public.developer_integration(id) ON DELETE CASCADE,
  court_id UUID NOT NULL REFERENCES public.court(id) ON DELETE CASCADE,
  court_block_id UUID REFERENCES public.court_block(id) ON DELETE SET NULL,
  external_window_id VARCHAR(128) NOT NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'ACTIVE',
  reason VARCHAR(255),
  last_synced_payload JSONB,
  last_synced_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_developer_unavailability_sync_external
  ON public.developer_unavailability_sync(integration_id, external_window_id);
CREATE UNIQUE INDEX IF NOT EXISTS uq_developer_unavailability_sync_block
  ON public.developer_unavailability_sync(court_block_id);
CREATE INDEX IF NOT EXISTS idx_developer_unavailability_sync_court_status
  ON public.developer_unavailability_sync(court_id, status);
