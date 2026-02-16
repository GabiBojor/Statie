-- RENAME tables to avoid conflicts with your other apps
ALTER TABLE IF EXISTS messages RENAME TO statie_messages;

-- If the table didn't exist (you skipped the previous step), create it now with the prefix:
CREATE TABLE IF NOT EXISTS statie_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  channel INTEGER NOT NULL,
  audio_url TEXT NOT NULL,
  user_id UUID DEFAULT auth.uid(),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable Realtime for the new table
DROP PUBLICATION IF EXISTS supabase_realtime;
CREATE PUBLICATION supabase_realtime FOR ALL TABLES;
ALTER PUBLICATION supabase_realtime ADD TABLE statie_messages;

-- Create a specific bucket for this app
INSERT INTO storage.buckets (id, name, public) 
VALUES ('statie-audio', 'statie-audio', true)
ON CONFLICT (id) DO NOTHING;

-- Policies for the new table
ALTER TABLE statie_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public Read statie_messages" ON statie_messages FOR SELECT USING (true);
CREATE POLICY "Public Insert statie_messages" ON statie_messages FOR INSERT WITH CHECK (true);

-- Policies for the new bucket
CREATE POLICY "Public Access statie-audio" ON storage.objects FOR ALL 
USING ( bucket_id = 'statie-audio' ) 
WITH CHECK ( bucket_id = 'statie-audio' );
