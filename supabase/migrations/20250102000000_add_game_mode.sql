-- Add game_mode column to rooms table
ALTER TABLE public.rooms 
ADD COLUMN game_mode TEXT NOT NULL DEFAULT 'normal' CHECK (game_mode IN ('normal', 'anonymous'));

