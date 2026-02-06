import { create } from 'zustand';
import type { SavedArgument, CaseData, Message, HealthState } from './types';

const HISTORY_KEY = 'ace_attorney_history';

interface HistoryActions {
  saveArgument: (arg: Omit<SavedArgument, 'id' | 'createdAt' | 'starred'>) => string;
  toggleStar: (id: string) => void;
  deleteArgument: (id: string) => void;
  getArgument: (id: string) => SavedArgument | undefined;
  hydrate: () => void;
  persist: () => void;
}

interface HistoryState {
  arguments: SavedArgument[];
}

export const useHistoryStore = create<HistoryState & HistoryActions>((set, get) => ({
  arguments: [],

  saveArgument: (arg) => {
    const id = `arg_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const saved: SavedArgument = {
      ...arg,
      id,
      createdAt: Date.now(),
      starred: false,
    };
    set((state) => {
      const updated = [saved, ...state.arguments];
      return { arguments: updated };
    });
    // Persist after state update
    setTimeout(() => get().persist(), 0);
    return id;
  },

  toggleStar: (id: string) => {
    set((state) => ({
      arguments: state.arguments.map((a) =>
        a.id === id ? { ...a, starred: !a.starred } : a
      ),
    }));
    setTimeout(() => get().persist(), 0);
  },

  deleteArgument: (id: string) => {
    set((state) => ({
      arguments: state.arguments.filter((a) => a.id !== id),
    }));
    setTimeout(() => get().persist(), 0);
  },

  getArgument: (id: string) => {
    return get().arguments.find((a) => a.id === id);
  },

  hydrate: () => {
    try {
      const raw = localStorage.getItem(HISTORY_KEY);
      if (raw) {
        const data = JSON.parse(raw) as SavedArgument[];
        set({ arguments: Array.isArray(data) ? data : [] });
      }
    } catch {
      // Ignore
    }
  },

  persist: () => {
    try {
      const { arguments: args } = get();
      localStorage.setItem(HISTORY_KEY, JSON.stringify(args));
    } catch {
      // localStorage not available
    }
  },
}));
