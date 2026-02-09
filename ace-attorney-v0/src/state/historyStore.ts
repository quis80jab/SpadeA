import { create } from 'zustand';
import type { SavedArgument } from './types';
import { createClient } from '@/src/lib/supabase/client';

const HISTORY_KEY = 'ace_attorney_history';

interface HistoryActions {
  saveArgument: (arg: Omit<SavedArgument, 'id' | 'createdAt' | 'starred' | 'is_public' | 'score'> & { score: number; is_public?: boolean }) => Promise<string>;
  toggleStar: (id: string) => void;
  deleteArgument: (id: string) => void;
  getArgument: (id: string) => SavedArgument | undefined;
  hydrate: () => Promise<void>;
  setUserId: (userId: string | null) => void;
}

interface HistoryState {
  arguments: SavedArgument[];
  userId: string | null;
}

function mapDbRow(row: Record<string, unknown>): SavedArgument {
  return {
    id: row.id as string,
    user_id: row.user_id as string,
    caseData: row.case_data as SavedArgument['caseData'],
    messages: row.messages as SavedArgument['messages'],
    outcome: row.outcome as SavedArgument['outcome'],
    finalHealth: row.final_health as SavedArgument['finalHealth'],
    exchangeCount: row.exchange_count as number,
    score: (row.score as number) ?? 0,
    starred: row.starred as boolean,
    is_public: row.is_public as boolean,
    createdAt: new Date(row.created_at as string).getTime(),
  };
}

export const useHistoryStore = create<HistoryState & HistoryActions>((set, get) => ({
  arguments: [],
  userId: null,

  setUserId: (userId) => set({ userId }),

  saveArgument: async (arg) => {
    const { userId } = get();
    const supabase = createClient();

    if (userId) {
      // Save to Supabase
      const { data, error } = await supabase
        .from('arguments')
        .insert({
          user_id: userId,
          case_data: arg.caseData,
          messages: arg.messages,
          outcome: arg.outcome,
          final_health: arg.finalHealth,
          exchange_count: arg.exchangeCount,
          score: arg.score,
          is_public: arg.is_public ?? true,
        })
        .select('id')
        .single();

      if (error) {
        console.error('Failed to save argument to Supabase:', error.message);
        // Fall back to localStorage
        return saveToLocal(arg, set, get);
      }

      const id = data.id;
      const saved: SavedArgument = {
        ...arg,
        id,
        user_id: userId,
        starred: false,
        is_public: arg.is_public ?? true,
        createdAt: Date.now(),
      };
      set((state) => ({ arguments: [saved, ...state.arguments] }));
      return id;
    } else {
      return saveToLocal(arg, set, get);
    }
  },

  toggleStar: async (id: string) => {
    const { userId } = get();
    const current = get().arguments.find((a) => a.id === id);
    if (!current) return;

    set((state) => ({
      arguments: state.arguments.map((a) =>
        a.id === id ? { ...a, starred: !a.starred } : a
      ),
    }));

    if (userId) {
      const supabase = createClient();
      await supabase
        .from('arguments')
        .update({ starred: !current.starred })
        .eq('id', id);
    } else {
      persistLocal(get);
    }
  },

  deleteArgument: async (id: string) => {
    const { userId } = get();

    set((state) => ({
      arguments: state.arguments.filter((a) => a.id !== id),
    }));

    if (userId) {
      const supabase = createClient();
      await supabase.from('arguments').delete().eq('id', id);
    } else {
      persistLocal(get);
    }
  },

  getArgument: (id: string) => {
    return get().arguments.find((a) => a.id === id);
  },

  hydrate: async () => {
    const { userId } = get();

    if (userId) {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('arguments')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (!error && data) {
        set({ arguments: data.map(mapDbRow) });
        return;
      }
    }

    // Fall back to localStorage
    try {
      const raw = localStorage.getItem(HISTORY_KEY);
      if (raw) {
        const data = JSON.parse(raw) as SavedArgument[];
        // Ensure old data has new fields
        const migrated = (Array.isArray(data) ? data : []).map((a) => ({
          ...a,
          score: a.score ?? 0,
          is_public: a.is_public ?? true,
        }));
        set({ arguments: migrated });
      }
    } catch {
      // Ignore
    }
  },
}));

// ─── localStorage helpers for unauthenticated users ───

function saveToLocal(
  arg: Omit<SavedArgument, 'id' | 'createdAt' | 'starred' | 'is_public'> & { is_public?: boolean },
  set: (fn: (state: HistoryState) => Partial<HistoryState>) => void,
  get: () => HistoryState & HistoryActions,
): string {
  const id = `arg_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const saved: SavedArgument = {
    ...arg,
    id,
    createdAt: Date.now(),
    starred: false,
    is_public: arg.is_public ?? true,
  };
  set((state) => ({ arguments: [saved, ...state.arguments] }));
  setTimeout(() => persistLocal(get), 0);
  return id;
}

function persistLocal(get: () => HistoryState) {
  try {
    const { arguments: args } = get();
    localStorage.setItem(HISTORY_KEY, JSON.stringify(args));
  } catch {
    // localStorage not available
  }
}
