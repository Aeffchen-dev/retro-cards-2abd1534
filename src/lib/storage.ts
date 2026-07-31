// Storage utility for persisting RetroCards state with 8-hour expiry

interface StoredData<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

const STORAGE_EXPIRY_HOURS = 8;
const STORAGE_EXPIRY_MS = STORAGE_EXPIRY_HOURS * 60 * 60 * 1000; // 8 hours in milliseconds

export const saveToStorage = <T>(key: string, data: T): void => {
  try {
    const now = Date.now();
    const storedData: StoredData<T> = {
      data,
      timestamp: now,
      expiresAt: now + STORAGE_EXPIRY_MS
    };
    
    localStorage.setItem(key, JSON.stringify(storedData));
  } catch (error) {
    console.warn('Failed to save to localStorage:', error);
  }
};

export const loadFromStorage = <T>(key: string): T | null => {
  try {
    const stored = localStorage.getItem(key);
    if (!stored) return null;

    const parsedData: StoredData<T> = JSON.parse(stored);
    const now = Date.now();

    // Check if data has expired
    if (now > parsedData.expiresAt) {
      localStorage.removeItem(key);
      return null;
    }

    return parsedData.data;
  } catch (error) {
    console.warn('Failed to load from localStorage:', error);
    return null;
  }
};

export const clearExpiredStorage = (): void => {
  try {
    const keys = Object.keys(localStorage);
    const now = Date.now();

    keys.forEach(key => {
      if (key.startsWith('retro-cards-')) {
        try {
          const stored = localStorage.getItem(key);
          if (stored) {
            const parsedData: StoredData<any> = JSON.parse(stored);
            if (now > parsedData.expiresAt) {
              localStorage.removeItem(key);
            }
          }
        } catch (error) {
          // If parsing fails, remove the corrupted entry
          localStorage.removeItem(key);
        }
      }
    });
  } catch (error) {
    console.warn('Failed to clear expired storage:', error);
  }
};

// Storage keys
export const STORAGE_KEYS = {
  CURRENT_CARD: 'retro-cards-current-card',
  MEMOJI_POSITIONS: 'retro-cards-memoji-positions',
  POST_IT_TEXTS: 'retro-cards-post-it-texts',
  TAKEAWAY_TEXTS: 'retro-cards-takeaway-texts',
  INTIMACY_RATINGS: 'retro-cards-intimacy-ratings',
  CURRENT_QUESTION: 'retro-cards-current-question',
  EDIT_MODE_NOTES: 'retro-cards-edit-mode-notes',
  SETUP_DATA: 'retro-cards-setup-data',
  REFLECTION_TEXTS: 'retro-cards-reflection-texts'
} as const;