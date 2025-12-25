// Word Service - API-based word generation with fallback

interface WordPair {
  crewmateWord: string;
  impostorWord: string;
}

interface CacheEntry {
  words: string[];
  timestamp: number;
}

// Seed words for API queries (Portuguese)
const SEED_WORDS = [
  "OCEANO",
  "CARRO",
  "CASA",
  "CACHORRO",
  "COMPUTADOR",
  "MONTANHA",
  "LIVRO",
  "ESCOLA",
  "AMIGO",
  "VIAGEM",
  "MUSICA",
  "ARVORE",
  "ESTRELA",
  "BICICLETA",
  "ELEFANTE",
];

// Fallback word pairs (Portuguese similar words)
const FALLBACK_WORD_PAIRS: WordPair[] = [
  { crewmateWord: "OCEANO", impostorWord: "MAR" },
  { crewmateWord: "CARRO", impostorWord: "VEÍCULO" },
  { crewmateWord: "CASA", impostorWord: "RESIDÊNCIA" },
  { crewmateWord: "CACHORRO", impostorWord: "CÃO" },
  { crewmateWord: "COMPUTADOR", impostorWord: "PC" },
  { crewmateWord: "MONTANHA", impostorWord: "COLINA" },
  { crewmateWord: "LIVRO", impostorWord: "OBRA" },
  { crewmateWord: "ESCOLA", impostorWord: "INSTITUTO" },
  { crewmateWord: "AMIGO", impostorWord: "COLEGA" },
  { crewmateWord: "VIAGEM", impostorWord: "FERIAS" },
  { crewmateWord: "MUSICA", impostorWord: "SOM" },
  { crewmateWord: "ARVORE", impostorWord: "FLORESTA" },
  { crewmateWord: "ESTRELA", impostorWord: "LUA" },
  { crewmateWord: "BICICLETA", impostorWord: "MOTO" },
  { crewmateWord: "ELEFANTE", impostorWord: "RINOCERONTE" },
  { crewmateWord: "BANANA", impostorWord: "MAÇÃ" },
  { crewmateWord: "GATO", impostorWord: "PEIXE" },
  { crewmateWord: "SOL", impostorWord: "LUA" },
  { crewmateWord: "FAMILIA", impostorWord: "PARENTE" },
  { crewmateWord: "SONHO", impostorWord: "META" },
];

// Cache for API responses (5 minute TTL)
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const wordCache = new Map<string, CacheEntry>();

/**
 * Fetches similar words from Datamuse API
 * Note: Datamuse primarily supports English, but we'll try Portuguese words
 * and fall back to hardcoded pairs if needed
 * @param word Base word to find similarities for
 * @returns Array of similar words
 */
const fetchSimilarWords = async (word: string): Promise<string[]> => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout

    // Try with Portuguese word first, then try English translation if available
    const response = await fetch(
      `https://api.datamuse.com/words?ml=${encodeURIComponent(word.toLowerCase())}&max=10`,
      {
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
        },
      }
    );

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`API returned ${response.status}`);
    }

    const data = await response.json();
    
    // Extract words from API response and convert to uppercase
    // Filter out very short words and duplicates
    const words = data
      .map((item: { word: string }) => item.word.toUpperCase())
      .filter((w: string) => 
        w.length >= 3 && 
        w !== word.toUpperCase() &&
        /^[A-ZÀÁÂÃÉÊÍÓÔÕÚÇ]+$/.test(w) // Only Portuguese/English letters
      );

    // If API returns results, use them; otherwise return empty to trigger fallback
    return words;
  } catch (error) {
    console.error(`Error fetching similar words for "${word}":`, error);
    return [];
  }
};

/**
 * Gets similar words with caching
 */
const getSimilarWordsCached = async (word: string): Promise<string[]> => {
  const cacheKey = word.toUpperCase();
  const cached = wordCache.get(cacheKey);

  // Check if cache is valid
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.words;
  }

  // Fetch from API
  const words = await fetchSimilarWords(word);

  // Cache the results (even if empty, to avoid repeated failed requests)
  if (words.length > 0) {
    wordCache.set(cacheKey, {
      words,
      timestamp: Date.now(),
    });
  }

  return words;
};

/**
 * Gets a random word pair using API or fallback
 */
export const getWordPair = async (): Promise<WordPair> => {
  // Pick a random seed word
  const baseWord = SEED_WORDS[Math.floor(Math.random() * SEED_WORDS.length)];

  try {
    // Try to get similar words from API
    const similarWords = await getSimilarWordsCached(baseWord);

    if (similarWords.length >= 2) {
      // Use API words - pick two different similar words
      const shuffled = [...similarWords].sort(() => Math.random() - 0.5);
      const crewmateWord = shuffled[0];
      const impostorWord = shuffled[1];

      // Ensure words are different
      if (crewmateWord !== impostorWord) {
        return {
          crewmateWord,
          impostorWord,
        };
      }
    }

    // If API didn't return enough words, try using base word + one similar
    if (similarWords.length >= 1) {
      const similarWord = similarWords[0];
      // Randomly assign which is crewmate and which is impostor
      if (Math.random() > 0.5) {
        return {
          crewmateWord: baseWord,
          impostorWord: similarWord,
        };
      } else {
        return {
          crewmateWord: similarWord,
          impostorWord: baseWord,
        };
      }
    }
  } catch (error) {
    console.error('Error in getWordPair:', error);
  }

  // Fallback to hardcoded pairs
  const fallbackPair = FALLBACK_WORD_PAIRS[
    Math.floor(Math.random() * FALLBACK_WORD_PAIRS.length)
  ];

  return fallbackPair;
};

/**
 * Clears the word cache (useful for testing)
 */
export const clearWordCache = (): void => {
  wordCache.clear();
};

