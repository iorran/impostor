-- Create word_pairs table to store all word pairs
CREATE TABLE public.word_pairs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  crewmate_word TEXT NOT NULL,
  impostor_word TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('agua', 'veiculos', 'casa', 'animais', 'natureza', 'tecnologia', 'corpo', 'comida', 'espaco', 'livros', 'musica', 'esportes')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create index for faster category filtering
CREATE INDEX idx_word_pairs_category ON public.word_pairs(category);

-- Enable Row Level Security
ALTER TABLE public.word_pairs ENABLE ROW LEVEL SECURITY;

-- RLS Policies - Allow public read access
CREATE POLICY "Anyone can view word pairs" ON public.word_pairs FOR SELECT USING (true);

