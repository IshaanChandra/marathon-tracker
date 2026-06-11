"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { AppState, DayLog, DayOverride } from "./types";
import { emptyState } from "./merge";

/**
 * Client state: logs / overrides / settings.
 * - Hydrates instantly from localStorage (offline cache), then refreshes from /api/state.
 * - Mutations apply optimistically, persist to localStorage, and POST to the API.
 */

const CACHE_KEY = "mt_state_v1";

interface Store {
  state: AppState;
  ready: boolean;
  syncError: boolean;
  setLog: (date: string, log: DayLog | null) => void;
  setOverride: (date: string, patch: DayOverride | null) => void;
  setSetting: (key: string, value: unknown) => void;
}

const StoreContext = createContext<Store | null>(null);

function readCache(): AppState | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    return raw ? (JSON.parse(raw) as AppState) : null;
  } catch {
    return null;
  }
}

function writeCache(state: AppState) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(state));
  } catch {
    // storage full / private mode — optimistic state still lives in memory
  }
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState>(emptyState);
  const [ready, setReady] = useState(false);
  const [syncError, setSyncError] = useState(false);

  useEffect(() => {
    const cached = readCache();
    if (cached) {
      setState(cached);
      setReady(true);
    }
    fetch("/api/state")
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((server: AppState) => {
        setState(server);
        writeCache(server);
        setSyncError(false);
      })
      .catch(() => setSyncError(true))
      .finally(() => setReady(true));
  }, []);

  const mutate = useCallback(
    (updater: (s: AppState) => AppState, endpoint: string, body: unknown) => {
      setState((prev) => {
        const next = updater(prev);
        writeCache(next);
        return next;
      });
      fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
        .then((r) => setSyncError(!r.ok))
        .catch(() => setSyncError(true));
    },
    [],
  );

  const setLog = useCallback(
    (date: string, log: DayLog | null) => {
      mutate(
        (s) => {
          const logs = { ...s.logs };
          if (log) logs[date] = log;
          else delete logs[date];
          return { ...s, logs };
        },
        "/api/log",
        { date, log },
      );
    },
    [mutate],
  );

  const setOverride = useCallback(
    (date: string, patch: DayOverride | null) => {
      mutate(
        (s) => {
          const overrides = { ...s.overrides };
          if (patch) overrides[date] = patch;
          else delete overrides[date];
          return { ...s, overrides };
        },
        "/api/override",
        { date, patch },
      );
    },
    [mutate],
  );

  const setSetting = useCallback(
    (key: string, value: unknown) => {
      mutate(
        (s) => {
          const settings = { ...s.settings };
          if (value === null) delete settings[key];
          else settings[key] = value;
          return { ...s, settings };
        },
        "/api/settings",
        { key, value },
      );
    },
    [mutate],
  );

  const store = useMemo(
    () => ({ state, ready, syncError, setLog, setOverride, setSetting }),
    [state, ready, syncError, setLog, setOverride, setSetting],
  );

  return <StoreContext.Provider value={store}>{children}</StoreContext.Provider>;
}

export function useStore(): Store {
  const store = useContext(StoreContext);
  if (!store) throw new Error("useStore must be used inside <StoreProvider>");
  return store;
}
