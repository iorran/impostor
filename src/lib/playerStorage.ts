/**
 * Utility functions for managing player name in localStorage
 */

const PLAYER_NAME_KEY = "playerName";

/**
 * Get player name from localStorage
 */
export const getPlayerName = (): string | null => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(PLAYER_NAME_KEY);
};

/**
 * Save player name to localStorage
 */
export const savePlayerName = (name: string): void => {
  if (typeof window === "undefined") return;
  localStorage.setItem(PLAYER_NAME_KEY, name.trim());
};

/**
 * Remove player name from localStorage
 */
export const removePlayerName = (): void => {
  if (typeof window === "undefined") return;
  localStorage.removeItem(PLAYER_NAME_KEY);
};

