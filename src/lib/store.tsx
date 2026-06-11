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
 * - Writes are durable: each mutation applies optimistically, then lands in a
 *   localStorage-persisted queue that flushes in order — surviving offline stretches,
 *   reloads, and expired PIN cookies (which pause the queue behind the PIN modal).
 */

const CACHE_KEY = "mt_state_v1";
const QUEUE_KEY = "mt_queue_v1";

interface QueuedOp {
  /** endpoint + record key — a newer write to the same record replaces the queued one */
  key: string;
  endpoint: string;
  body: unknown;
  ts: number;
}

interface Store {
  state: AppState;
  ready: boolean;
  /** true when the last read from the server failed (viewing cached data) */
  syncError: boolean;
  /** queued writes not yet confirmed by the server */
  pendingCount: number;
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

function readJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJSON(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // storage full / private mode — in-memory state still works this session
  }
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState>(emptyState);
  const [ready, setReady] = useState(false);
  const [syncError, setSyncError] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [authed, setAuthed] = useState(false);
  const [pinPromptOpen, setPinPromptOpen] = useState(false);
  // A mutation attempted while view-only; runs right after a successful unlock.
  const pendingMutation = useRef<(() => void) | null>(null);
  const flushing = useRef(false);
  const authedRef = useRef(authed);
  authedRef.current = authed;

  const readQueue = () => readJSON<QueuedOp[]>(QUEUE_KEY, []);
  const writeQueue = useCallback((q: QueuedOp[]) => {
    writeJSON(QUEUE_KEY, q);
    setPendingCount(q.length);
  }, []);

  /** Serially POST queued ops. Stops on network/5xx (retry later) or 401 (PIN modal). */
  const flush = useCallback(async () => {
    if (flushing.current) return;
    flushing.current = true;
    try {
      for (;;) {
        const queue = readQueue();
        if (queue.length === 0) break;
        const op = queue[0];
        let res: Response;
        try {
          res = await fetch(op.endpoint, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(op.body),
          });
        } catch {
          return; // offline — keep the queue, retry on the next trigger
        }
        if (res.ok) {
          // re-read: a newer write may have replaced this op while the POST was in flight
          writeQueue(readQueue().filter((q) => !(q.key === op.key && q.ts === op.ts)));
          continue;
        }
        if (res.status === 401) {
          setAuthed(false);
          setPinPromptOpen(true);
          return; // paused — unlock() flushes again
        }
        // other 4xx: malformed op would wedge the queue forever — drop it
        writeQueue(readQueue().slice(1));
      }
    } finally {
      flushing.current = false;
    }
  }, [writeQueue]);

  const flushRef = useRef(flush);
  flushRef.current = flush;

  useEffect(() => {
    const cached = readJSON<AppState | null>(CACHE_KEY, null);
    if (cached) {
      setState(cached);
      setReady(true);
    }
    setPendingCount(readQueue().length);
    fetch("/api/state")
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((server: AppState) => {
        setState(server);
        writeJSON(CACHE_KEY, server);
        setSyncError(false);
      })
      .catch(() => setSyncError(true))
      .finally(() => setReady(true));
    fetch("/api/auth")
      .then((r) => r.json())
      .then((d: { authed: boolean }) => setAuthed(!!d.authed))
      .catch(() => setAuthed(false));

    flushRef.current();
    const onOnline = () => flushRef.current();
    const onVisible = () => {
      if (document.visibilityState === "visible") flushRef.current();
    };
    window.addEventListener("online", onOnline);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.removeEventListener("online", onOnline);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  const enqueue = useCallback(
    (key: string, endpoint: string, body: unknown) => {
      // last write to a record wins — matches the server's upsert semantics
      const queue = readQueue().filter((op) => op.key !== key);
      queue.push({ key, endpoint, body, ts: Date.now() });
      writeQueue(queue);
      void flushRef.current();
    },
    [writeQueue],
  );

  const runMutation = useCallback(
    (updater: (s: AppState) => AppState, key: string, endpoint: string, body: unknown) => {
      setState((prev) => {
        const next = updater(prev);
        writeJSON(CACHE_KEY, next);
        return next;
      });
      enqueue(key, endpoint, body);
    },
    [enqueue],
  );

  const mutate = useCallback(
    (updater: (s: AppState) => AppState, key: string, endpoint: string, body: unknown) => {
      if (!authedRef.current) {
        pendingMutation.current = () => runMutation(updater, key, endpoint, body);
        setPinPromptOpen(true);
        return;
      }
      runMutation(updater, key, endpoint, body);
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
      void flushRef.current();
      return true;
    } catch {
      return false;
    }
  }, []);

  const openPinPrompt = useCallback(() => setPinPromptOpen(true), []);
  const closePinPrompt = useCallback(() => {
    pendingMutation.current = null;
    setPinPromptOpen(false);
  }, []);

  const setLog = useCallback(
    (date: string, log: DayLog | null) => {
      mutate(
        (s) => {
          const logs = { ...s.logs };
          if (log) logs[date] = log;
          else delete logs[date];
          return { ...s, logs };
        },
        `log:${date}`,
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
        `override:${date}`,
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
        `setting:${key}`,
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
      pendingCount,
      authed,
      pinPromptOpen,
      openPinPrompt,
      closePinPrompt,
      unlock,
      setLog,
      setOverride,
      setSetting,
    }),
    [state, ready, syncError, pendingCount, authed, pinPromptOpen, openPinPrompt, closePinPrompt, unlock, setLog, setOverride, setSetting],
  );

  return <StoreContext.Provider value={store}>{children}</StoreContext.Provider>;
}

export function useStore(): Store {
  const store = useContext(StoreContext);
  if (!store) throw new Error("useStore must be used inside <StoreProvider>");
  return store;
}
