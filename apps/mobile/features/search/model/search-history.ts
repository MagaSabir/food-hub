import * as SecureStore from 'expo-secure-store';
import { create } from 'zustand';

const STORAGE_KEY = 'foodhub.searchHistory';

const MAX_ENTRIES = 8;

interface SearchHistoryState {
  queries: string[];
  isLoaded: boolean;
  load: () => Promise<void>;
  remember: (query: string) => void;
  forget: (query: string) => void;
  clear: () => void;
}

export const useSearchHistoryStore = create<SearchHistoryState>((set, get) => ({
  queries: [],
  isLoaded: false,

  load: async () => {
    if (get().isLoaded) return;

    try {
      const raw = await SecureStore.getItemAsync(STORAGE_KEY);
      const parsed: unknown = raw ? JSON.parse(raw) : [];

      const queries = Array.isArray(parsed)
        ? parsed.filter((item): item is string => typeof item === 'string')
        : [];

      set({ queries: queries.slice(0, MAX_ENTRIES), isLoaded: true });
    } catch {
      set({ isLoaded: true });
    }
  },

  remember: (query) => {
    const value = query.trim();
    if (value.length === 0) return;

    const withoutDuplicate = get().queries.filter(
      (item) => item.toLowerCase() !== value.toLowerCase(),
    );
    const queries = [value, ...withoutDuplicate].slice(0, MAX_ENTRIES);

    set({ queries });
    persist(queries);
  },

  forget: (query) => {
    const queries = get().queries.filter((item) => item !== query);

    set({ queries });
    persist(queries);
  },

  clear: () => {
    set({ queries: [] });
    persist([]);
  },
}));

function persist(queries: string[]): void {
  void SecureStore.setItemAsync(STORAGE_KEY, JSON.stringify(queries)).catch(
    () => {},
  );
}
