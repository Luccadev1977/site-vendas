'use client';
import { createContext, useContext, useEffect, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { isGitHubPages } from '@/lib/deployment';
import { browserConfigured } from '@/lib/browser-platform';
import { browserSupabase } from '@/lib/supabase/browser';
const SessionContext = createContext<{ user: User | null; ready: boolean; error: string }>({
  user: null,
  ready: false,
  error: '',
});
export function useBrowserSession() {
  return useContext(SessionContext);
}
export function BrowserRuntime({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<{ user: User | null; ready: boolean; error: string }>({
    user: null,
    ready: !isGitHubPages || !browserConfigured(),
    error: '',
  });
  useEffect(() => {
    if (!isGitHubPages || !browserConfigured()) return;
    let active = true,
      version = 0;
    const db = browserSupabase();
    async function sync() {
      const current = ++version;
      try {
        const { data, error } = await db.auth.getUser();
        if (active && current === version)
          setState({
            user: data.user,
            ready: true,
            error: error && data.user ? 'Não foi possível verificar a sessão.' : '',
          });
      } catch {
        if (active && current === version)
          setState({
            user: null,
            ready: true,
            error: 'Não foi possível verificar a sessão. Tente novamente.',
          });
      }
    }
    void sync();
    const { data: listener } = db.auth.onAuthStateChange(() => {
      queueMicrotask(() => {
        void sync();
      });
    });
    window.addEventListener('nexo-session', sync);
    return () => {
      active = false;
      version++;
      listener.subscription.unsubscribe();
      window.removeEventListener('nexo-session', sync);
    };
  }, []);
  return <SessionContext.Provider value={state}>{children}</SessionContext.Provider>;
}
