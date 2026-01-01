-- Add unique constraint to prevent duplicate word pairs
-- This ensures that the same crewmate_word + impostor_word + category combination cannot exist twice
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'word_pairs_unique_combination'
  ) THEN
    ALTER TABLE public.word_pairs 
    ADD CONSTRAINT word_pairs_unique_combination 
    UNIQUE (crewmate_word, impostor_word, category);
  END IF;
END $$;

-- Add new word pairs to word_pairs table
-- Uses ON CONFLICT to prevent duplicates based on crewmate_word, impostor_word, and category combination
INSERT INTO public.word_pairs (crewmate_word, impostor_word, category, created_at)
VALUES
  -- ================= ANIMAIS =================
  ('MORCEGO', 'ECO', 'animais', now()),
  ('POLVO', 'CAMUFLAGEM', 'animais', now()),
  ('FORMIGA', 'COLÔNIA', 'animais', now()),
  ('LOBO', 'ALCATÉIA', 'animais', now()),
  ('CORUJA', 'NOITE', 'animais', now()),
  ('CAMELO', 'RESERVA', 'animais', now()),
  ('PINGUIM', 'IMPERMEABILIDADE', 'animais', now()),
  ('GOLFINHO', 'SONAR', 'animais', now()),
  ('CARACOL', 'ESPIRAL', 'animais', now()),
  ('ESCORPIÃO', 'DEFESA', 'animais', now()),

  -- ================= COMIDA =================
  ('FERMENTO', 'EXPANSÃO', 'comida', now()),
  ('VINHO', 'OXIDAÇÃO', 'comida', now()),
  ('CAFÉ', 'EXTRAÇÃO', 'comida', now()),
  ('CHÁ', 'INFUSÃO', 'comida', now()),
  ('MANTEIGA', 'EMULSÃO', 'comida', now()),
  ('MASSA', 'ELASTICIDADE', 'comida', now()),
  ('SAL', 'CRISTALIZAÇÃO', 'comida', now()),
  ('AÇÚCAR', 'CARAMELIZAÇÃO', 'comida', now()),
  ('QUEIJO', 'MATURAÇÃO', 'comida', now()),
  ('PÃO', 'FERMENTAÇÃO', 'comida', now()),

  -- ================= CASA =================
  ('PAREDE', 'ISOLAMENTO', 'casa', now()),
  ('TELHADO', 'DRENAGEM', 'casa', now()),
  ('PORTA', 'VEDAÇÃO', 'casa', now()),
  ('CHÃO', 'ATRITO', 'casa', now()),
  ('ESCADA', 'DESNÍVEL', 'casa', now()),
  ('JANELA', 'VENTILAÇÃO', 'casa', now()),
  ('GARAGEM', 'MANOBRA', 'casa', now()),
  ('QUARTO', 'PRIVACIDADE', 'casa', now()),
  ('BANHEIRO', 'UMIDADE', 'casa', now()),
  ('SALA', 'ACÚSTICA', 'casa', now()),

  -- ================= LIVROS =================
  ('ROMANCE', 'NARRADOR', 'livros', now()),
  ('POESIA', 'METÁFORA', 'livros', now()),
  ('TEXTO', 'COERÊNCIA', 'livros', now()),
  ('LEITURA', 'INTERPRETAÇÃO', 'livros', now()),
  ('CAPÍTULO', 'PROGRESSÃO', 'livros', now()),
  ('GRAMÁTICA', 'SINTAXE', 'livros', now()),
  ('DICIONÁRIO', 'DEFINIÇÃO', 'livros', now()),
  ('PARÁGRAFO', 'COESÃO', 'livros', now()),
  ('ENSAIO', 'ARGUMENTAÇÃO', 'livros', now()),
  ('BIBLIOGRAFIA', 'REFERÊNCIA', 'livros', now()),

  -- ================= TECNOLOGIA =================
  ('ALGORITMO', 'EFICIÊNCIA', 'tecnologia', now()),
  ('CACHE', 'LATÊNCIA', 'tecnologia', now()),
  ('CRIPTOGRAFIA', 'ENTROPIA', 'tecnologia', now()),
  ('API', 'CONTRATO', 'tecnologia', now()),
  ('THREAD', 'CONCORRÊNCIA', 'tecnologia', now()),
  ('SERVIDOR', 'ESCALABILIDADE', 'tecnologia', now()),
  ('BANCO DE DADOS', 'CONSISTÊNCIA', 'tecnologia', now()),
  ('SENSOR', 'CALIBRAÇÃO', 'tecnologia', now()),
  ('FRONTEND', 'RENDERIZAÇÃO', 'tecnologia', now()),
  ('BACKEND', 'ORQUESTRAÇÃO', 'tecnologia', now()),

  -- ================= MÚSICA =================
  ('MELODIA', 'INTERVALO', 'musica', now()),
  ('RITMO', 'TEMPO', 'musica', now()),
  ('HARMONIA', 'TENSÃO', 'musica', now()),
  ('SINFONIA', 'MOVIMENTO', 'musica', now()),
  ('ESCALA', 'PROGRESSÃO', 'musica', now()),
  ('TIMBRE', 'RESSONÂNCIA', 'musica', now()),
  ('ACORDE', 'DISSONÂNCIA', 'musica', now()),
  ('SILÊNCIO', 'PAUSA', 'musica', now()),
  ('CORAL', 'POLIFONIA', 'musica', now()),
  ('BATIDA', 'SINCOPA', 'musica', now()),

  -- ================= ESPORTES =================
  ('CORRIDA', 'CADÊNCIA', 'esportes', now()),
  ('FUTEBOL', 'POSICIONAMENTO', 'esportes', now()),
  ('NATAÇÃO', 'FLUTUAÇÃO', 'esportes', now()),
  ('CICLISMO', 'AERODINÂMICA', 'esportes', now()),
  ('BOXE', 'TEMPO', 'esportes', now()),
  ('SURFE', 'LEITURA', 'esportes', now()),
  ('ESCALADA', 'ADERÊNCIA', 'esportes', now()),
  ('TÊNIS', 'SPIN', 'esportes', now()),
  ('BASQUETE', 'ESPAÇAMENTO', 'esportes', now()),
  ('GOLFE', 'PRECISÃO', 'esportes', now()),

  -- ================= NATUREZA =================
  ('FLORESTA', 'BIODIVERSIDADE', 'natureza', now()),
  ('RIO', 'EROSÃO', 'natureza', now()),
  ('DESERTO', 'AMPLITUDE', 'natureza', now()),
  ('MONTANHA', 'OROGÊNESE', 'natureza', now()),
  ('CHUVA', 'PRECIPITAÇÃO', 'natureza', now()),
  ('SOLO', 'NUTRIENTES', 'natureza', now()),
  ('VENTO', 'CISALHAMENTO', 'natureza', now()),
  ('GELO', 'DENSIDADE', 'natureza', now()),
  ('ECOSSISTEMA', 'EQUILÍBRIO', 'natureza', now()),
  ('CAVERNA', 'EROSÃO', 'natureza', now()),

  -- ================= ÁGUA =================
  ('OCEANO', 'CIRCULAÇÃO', 'agua', now()),
  ('MARÉ', 'GRAVITAÇÃO', 'agua', now()),
  ('ONDA', 'PERÍODO', 'agua', now()),
  ('CORAL', 'SIMBIOSE', 'agua', now()),
  ('LAGO', 'ESTRATIFICAÇÃO', 'agua', now()),
  ('ESTUÁRIO', 'SALINIDADE', 'agua', now()),
  ('SUBMERSÃO', 'PRESSÃO', 'agua', now()),
  ('GOTA', 'COESÃO', 'agua', now()),
  ('CORRENTE', 'VELOCIDADE', 'agua', now()),
  ('NEBLINA', 'CONDENSAÇÃO', 'agua', now()),

  -- ================= ESPAÇO =================
  ('ESTRELA', 'FUSÃO', 'espaco', now()),
  ('PLANETA', 'DENSIDADE', 'espaco', now()),
  ('ÓRBITA', 'ESTABILIDADE', 'espaco', now()),
  ('GALÁXIA', 'ROTAÇÃO', 'espaco', now()),
  ('SUPERNOVA', 'COLAPSO', 'espaco', now()),
  ('BURACO NEGRO', 'HORIZONTE', 'espaco', now()),
  ('LUZ', 'ESPECTRO', 'espaco', now()),
  ('COMETA', 'SUBLIMAÇÃO', 'espaco', now()),
  ('MARTE', 'OXIDAÇÃO', 'espaco', now()),
  ('SATÉLITE', 'TRAJETÓRIA', 'espaco', now()),

  -- ================= CORPO =================
  ('CÉREBRO', 'PLASTICIDADE', 'corpo', now()),
  ('MÚSCULO', 'CONTRAÇÃO', 'corpo', now()),
  ('PULMÃO', 'DIFUSÃO', 'corpo', now()),
  ('CORAÇÃO', 'RITMO', 'corpo', now()),
  ('PELE', 'PERMEABILIDADE', 'corpo', now()),
  ('SANGUE', 'VISCOSIDADE', 'corpo', now()),
  ('OLHO', 'FOCO', 'corpo', now()),
  ('SISTEMA NERVOSO', 'SINAPSE', 'corpo', now()),
  ('FÍGADO', 'METABOLISMO', 'corpo', now()),
  ('RIM', 'HOMEOSTASE', 'corpo', now())
ON CONFLICT (crewmate_word, impostor_word, category) DO NOTHING;

