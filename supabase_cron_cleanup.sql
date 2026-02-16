-- Activează extensia pg_cron (necesară pentru joburi programate)
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;

-- Funcție care șterge mesajele și fișierele audio mai vechi de 60 de minute
CREATE OR REPLACE FUNCTION delete_old_messages()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- 1. Șterge fișierele audio din bucket-ul 'statie-audio' care sunt mai vechi de 60 min
  -- Nota: Ștergerea din storage.objects declanșează ștergerea efectivă a fișierului
  DELETE FROM storage.objects
  WHERE bucket_id = 'statie-audio'
  AND created_at < (now() - INTERVAL '60 minutes');

  -- 2. Șterge înregistrările din tabelul de mesaje
  DELETE FROM statie_messages
  WHERE created_at < (now() - INTERVAL '60 minutes');
END;
$$;

-- Programează job-ul să ruleze la fiecare 10 minute
-- (Pentru a nu încărca baza de date, verificăm la 10 min, nu la fiecare minut)
SELECT cron.schedule(
  'cleanup-old-messages', -- Nume unic al jobului
  '*/10 * * * *',         -- Expresie cron (la fiecare 10 minute)
  $$SELECT delete_old_messages()$$
);

-- Pentru verificare (opțional):
-- select * from cron.job;
