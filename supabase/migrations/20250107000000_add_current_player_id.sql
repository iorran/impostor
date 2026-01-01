-- Add current_player_id column to rooms table
-- This tracks which player is currently speaking/playing
ALTER TABLE public.rooms 
ADD COLUMN current_player_id UUID REFERENCES public.players(id) ON DELETE SET NULL;

