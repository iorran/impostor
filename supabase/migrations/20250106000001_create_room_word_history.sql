-- Create room_word_history table to track word pairs used in recent rounds
-- This helps avoid repeating words in the last 30 rounds
CREATE TABLE public.room_word_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  round_number INT NOT NULL,
  word_pair_id UUID NOT NULL REFERENCES public.word_pairs(id) ON DELETE CASCADE,
  used_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(room_id, round_number)
);

-- Create index for faster lookups
CREATE INDEX idx_room_word_history_room_round ON public.room_word_history(room_id, round_number DESC);
CREATE INDEX idx_room_word_history_word_pair ON public.room_word_history(word_pair_id);

-- Enable Row Level Security
ALTER TABLE public.room_word_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies - Allow public access
CREATE POLICY "Anyone can view room word history" ON public.room_word_history FOR SELECT USING (true);
CREATE POLICY "Anyone can insert room word history" ON public.room_word_history FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can delete room word history" ON public.room_word_history FOR DELETE USING (true);

-- Function to cleanup old history entries (keep only last 30 rounds per room)
CREATE OR REPLACE FUNCTION cleanup_old_word_history()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER := 0;
BEGIN
  -- For each room, keep only the last 30 rounds
  WITH ranked_history AS (
    SELECT 
      id,
      room_id,
      round_number,
      ROW_NUMBER() OVER (PARTITION BY room_id ORDER BY round_number DESC) as rn
    FROM public.room_word_history
  )
  DELETE FROM public.room_word_history
  WHERE id IN (
    SELECT id FROM ranked_history WHERE rn > 30
  );
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION cleanup_old_word_history() TO authenticated;
GRANT EXECUTE ON FUNCTION cleanup_old_word_history() TO service_role;

