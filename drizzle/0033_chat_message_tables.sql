-- Chat Message table
CREATE TABLE IF NOT EXISTS public.chat_message (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id VARCHAR(128) NOT NULL,
  sender_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  content TEXT,
  attachments JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_chat_message_thread_created
  ON public.chat_message(thread_id, created_at);
CREATE INDEX IF NOT EXISTS idx_chat_message_sender
  ON public.chat_message(sender_user_id);

-- Chat Thread Read Position table
CREATE TABLE IF NOT EXISTS public.chat_thread_read_position (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id VARCHAR(128) NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  last_read_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_chat_thread_read_position_thread_user UNIQUE (thread_id, user_id)
);

-- Enable RLS
ALTER TABLE public.chat_message ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_thread_read_position ENABLE ROW LEVEL SECURITY;

-- RLS: authenticated users can read all messages (thread membership enforced at app layer)
CREATE POLICY chat_message_select_authenticated ON public.chat_message
  FOR SELECT TO authenticated USING (true);

-- RLS: users can insert their own messages
CREATE POLICY chat_message_insert_own ON public.chat_message
  FOR INSERT TO authenticated WITH CHECK (sender_user_id = auth.uid());

-- RLS: users can read their own read positions
CREATE POLICY chat_thread_read_position_select_own ON public.chat_thread_read_position
  FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY chat_thread_read_position_insert_own ON public.chat_thread_read_position
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE POLICY chat_thread_read_position_update_own ON public.chat_thread_read_position
  FOR UPDATE TO authenticated USING (user_id = auth.uid());

-- Enable realtime for chat_message table
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_message;
