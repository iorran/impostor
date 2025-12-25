-- Add starting_player_id column to rooms table
ALTER TABLE public.rooms 
ADD COLUMN starting_player_id UUID REFERENCES public.players(id) ON DELETE SET NULL;

