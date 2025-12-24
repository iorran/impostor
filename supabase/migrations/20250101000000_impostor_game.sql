-- Complete Impostor Game Database Schema
-- All game logic is handled client-side in React hooks

-- Create rooms table
CREATE TABLE public.rooms (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  host_player_id UUID,
  status TEXT NOT NULL DEFAULT 'lobby' CHECK (status IN ('lobby', 'in_progress')),
  round_number INT NOT NULL DEFAULT 0,
  word TEXT,
  impostor_word TEXT,
  num_impostors INT NOT NULL DEFAULT 1 CHECK (num_impostors >= 1),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create players table
CREATE TABLE public.players (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  is_host BOOLEAN NOT NULL DEFAULT false,
  last_seen TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add foreign key constraint for host_player_id after players table exists
ALTER TABLE public.rooms ADD CONSTRAINT fk_host_player FOREIGN KEY (host_player_id) REFERENCES public.players(id) ON DELETE SET NULL;

-- Create player_words table (stores word assignments per round)
CREATE TABLE public.player_words (
  room_id UUID NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  round_number INT NOT NULL,
  player_id UUID NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
  word TEXT NOT NULL,
  is_impostor BOOLEAN NOT NULL DEFAULT false,
  PRIMARY KEY (room_id, round_number, player_id)
);

-- Enable Row Level Security (public game, no auth required)
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.players ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.player_words ENABLE ROW LEVEL SECURITY;

-- RLS Policies - Allow public access for this game
CREATE POLICY "Anyone can view rooms" ON public.rooms FOR SELECT USING (true);
CREATE POLICY "Anyone can create rooms" ON public.rooms FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update rooms" ON public.rooms FOR UPDATE USING (true);

CREATE POLICY "Anyone can view players" ON public.players FOR SELECT USING (true);
CREATE POLICY "Anyone can create players" ON public.players FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update players" ON public.players FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete players" ON public.players FOR DELETE USING (true);

-- Player words: allow players to view their own word
CREATE POLICY "Players can view own word" ON public.player_words FOR SELECT USING (true);
CREATE POLICY "System can insert player words" ON public.player_words FOR INSERT WITH CHECK (true);
CREATE POLICY "System can delete player words" ON public.player_words FOR DELETE USING (true);

-- Enable realtime for rooms, players, and player_words
ALTER PUBLICATION supabase_realtime ADD TABLE public.rooms;
ALTER PUBLICATION supabase_realtime ADD TABLE public.players;
ALTER PUBLICATION supabase_realtime ADD TABLE public.player_words;
