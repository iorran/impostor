-- Add word_category column to rooms table
ALTER TABLE public.rooms 
ADD COLUMN word_category TEXT DEFAULT 'all' CHECK (word_category IN ('all', 'agua', 'veiculos', 'casa', 'animais', 'natureza', 'tecnologia', 'corpo', 'comida', 'espaco', 'livros', 'musica', 'esportes'));

