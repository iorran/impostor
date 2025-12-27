-- Cleanup empty rooms when last player leaves
-- This trigger automatically deletes a room when all players have left

-- Function to cleanup empty rooms
CREATE OR REPLACE FUNCTION cleanup_empty_room()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if room has any remaining players
  IF NOT EXISTS (
    SELECT 1 FROM public.players 
    WHERE room_id = OLD.room_id
  ) THEN
    -- Room is empty, delete it (cascades to player_words via FK)
    DELETE FROM public.rooms WHERE id = OLD.room_id;
  END IF;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Trigger to cleanup room when last player leaves
CREATE TRIGGER on_player_delete_cleanup_room
AFTER DELETE ON public.players
FOR EACH ROW
EXECUTE FUNCTION cleanup_empty_room();

