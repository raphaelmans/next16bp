ALTER PUBLICATION supabase_realtime ADD TABLE public.reservation_event;
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_notification;

-- Supabase Realtime filter validation calls has_column_privilege for the
-- role from the JWT claims. The browser client connects with the publishable
-- key (anon role), so both anon and authenticated need SELECT.
GRANT SELECT ON TABLE public.reservation_event TO authenticated, anon;
GRANT SELECT ON TABLE public.user_notification TO authenticated;

-- Supabase Realtime requires filter columns to be in the WAL output.
-- REPLICA IDENTITY DEFAULT only includes PK columns (id).
-- reservation_event is filtered by reservation_id, so FULL is needed.
ALTER TABLE public.reservation_event REPLICA IDENTITY FULL;
