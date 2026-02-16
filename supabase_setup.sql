-- 1. Create a table for radio messages
CREATE TABLE IF NOT EXISTS messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  channel INTEGER NOT NULL,
  audio_url TEXT NOT NULL,
  user_id UUID DEFAULT auth.uid(), -- Can be null for anonymous users
  created_at TIMESTAMPTZ DEFAULT now(),
  location JSONB -- Optional: store lat/long as { latitude: ..., longitude: ... }
);

-- 2. Enable Realtime for the messages table
ALTER PUBLICATION supabase_realtime ADD TABLE messages;

-- 3. Create a Storage Bucket for audio files
INSERT INTO storage.buckets (id, name, public) 
VALUES ('audio-messages', 'audio-messages', true)
ON CONFLICT (id) DO NOTHING;

-- 4. Enable Row Level Security (RLS) but allow public access (for demo purposes)
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Allow anon users to read/write messages
CREATE POLICY "Public Access Messages" 
ON messages FOR ALL 
USING (true) 
WITH CHECK (true);

-- Allow anon users to upload audio
CREATE POLICY "Public Access Storage" 
ON storage.objects FOR ALL 
USING ( bucket_id = 'audio-messages' ) 
WITH CHECK ( bucket_id = 'audio-messages' );
