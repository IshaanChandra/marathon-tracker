"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { AppState, DayLog, DayOverride } from "./types";
import { emptyState } from "./merge";

/**
 * Client state: logs / overrides / settings.
 * - Reading is public: hydrates from localStorage cache, then refreshes from /api/state.
 * - Writing needs the PIN: mutations on an un-authed device open a PIN prompt first,
 *   then run; on an authed device they apply optimistically and POST.
 */

const CACHE_KEY = "mt_state_v1";

interface Store {
  state: AppState;
  ready: boolean;
  syncError: boolean;
  authed: boolean;
  pinPromptOpen: boolean;
  openPinPrompt: () => void;
  closePinPrompt: () => void;
  unlock: (pin: string) => Promise<boolean>;
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
  const [authed, setAuthed] = useState(false);
  const [pinPromptOpen, setPinPromptOpen] = useState(false);
  // The mutation that triggered the PIN prompt; runs right after a successful unlock.
  const pendingMutation = useRef<(() => void) | null>(null);

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
    fetch("/api/auth")
      .then((r) => r.json())
      .then((d: { authed: boolean }) => setAuthed(!!d.authed))
      .catch(() => setAuthed(false));
  }, []);

  const runMutation = useCallback(
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
        .then((r) => {
          if (r.status === 401) {
            // Cookie expired since page load — re-prompt, retry just the POST
            setAuthed(false);
            pendingMutation.current = () => runMutation((s) => s, endpoint, body);
            setPinPromptOpen(true);
          } else {
            setSyncError(!r.ok);
          }
        })
        .catch(() => setSyncError(true));
    },
    [],
  );

  const authedRef = useRef(authed);
  authedRef.current = authed;

  const mutate = useCallback(
    (updater: (s: AppState) => AppState, endpoint: string, body: unknown) => {
      if (!authedRef.current) {
        pendingMutation.current = () => runMutation(updater, endpoint, body);
        setPinPromptOpen(true);
        return;
      }
      runMutation(updater, endpoint, body);
    },
    [runMutation],
  );

  const unlock = useCallback(async (pin: string): Promise<boolean> => {
    try {
      const res = await fetch("/api/pin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin }),
      });
      if (!res.ok) return false;
      setAuthed(true);
      setPinPromptOpen(false);
      pendingMutation.current?.();
      pendingMutation.current = null;
      return true;
    } catch {
      return false;
    }
  }, []);

  const closePinPrompt = useCallback(() => {
    pendingMutation.current = null;
    setPinPromptOpen(false);
  }, []);

  const openPinPrompt = useCallback(() => setPinPromptOpen(true), []);

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
    () => ({
      state,
      ready,
      syncError,
      authed,
      pinPromptOpen,
      openPinPrompt,
      closePinPrompt,
      unlock,
      setLog,
      setOverride,
      setSetting,
    }),
    [state, ready, syncError, authed, pinPromptOpen, openPinPrompt, closePinPrompt, unlock, setLog, setOverride, setSetting],
  );

  return <StoreContext.Provider value={store}>{children}</StoreContext.Provider>;
}

export function useStore(): Store {
  const store = useContext(StoreContext);
  if (!store) throw new Error("useStore must be used inside <StoreProvider>");
  return store;
}
