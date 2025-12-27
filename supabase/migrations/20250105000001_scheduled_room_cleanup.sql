-- Scheduled cleanup for inactive rooms
-- This function periodically cleans up old and empty rooms

-- Function to cleanup inactive rooms
CREATE OR REPLACE FUNCTION cleanup_inactive_rooms()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER := 0;
  empty_rooms_count INTEGER;
  inactive_rooms_count INTEGER;
BEGIN
  -- Delete empty rooms (safety net for any that slipped through)
  DELETE FROM public.rooms
  WHERE id NOT IN (SELECT DISTINCT room_id FROM public.players WHERE room_id IS NOT NULL)
    AND status = 'lobby';
  
  GET DIAGNOSTICS empty_rooms_count = ROW_COUNT;
  deleted_count := deleted_count + empty_rooms_count;
  
  -- Delete inactive rooms (>24 hours old, in lobby, with no players)
  DELETE FROM public.rooms
  WHERE created_at < NOW() - INTERVAL '24 hours'
    AND status = 'lobby'
    AND id NOT IN (SELECT DISTINCT room_id FROM public.players WHERE room_id IS NOT NULL);
  
  GET DIAGNOSTICS inactive_rooms_count = ROW_COUNT;
  deleted_count := deleted_count + inactive_rooms_count;
  
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users (for cron jobs)
GRANT EXECUTE ON FUNCTION cleanup_inactive_rooms() TO authenticated;
GRANT EXECUTE ON FUNCTION cleanup_inactive_rooms() TO service_role;

-- Note: To set up pg_cron job, run this SQL in Supabase SQL Editor:
-- SELECT cron.schedule(
--   'cleanup-inactive-rooms',
--   '0 * * * *', -- Every hour at minute 0
--   $$SELECT cleanup_inactive_rooms()$$
-- );
-- 
-- To check if pg_cron is available:
-- SELECT * FROM pg_extension WHERE extname = 'pg_cron';
-- 
-- If pg_cron is not available, you can call this function manually
-- or set up a Supabase Edge Function that calls it periodically.

