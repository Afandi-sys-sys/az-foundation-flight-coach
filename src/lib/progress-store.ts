/**
 * localStorage-backed store. One key holds everything; every change is saved
 * immediately and other tabs are kept in sync through the "storage" event.
 */
import { useSyncExternalStore } from "react";
import { emptyState, sanitizeState, STORAGE_KEY, type ProgressState } from "./progress-logic";

const SERVER_SNAPSHOT = emptyState();
let current: ProgressState | null = null;
const listeners = new Set<() => void>();

function load(): ProgressState {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? sanitizeState(JSON.parse(raw)) : emptyState();
  } catch {
    return emptyState();
  }
}

function getSnapshot(): ProgressState {
  if (typeof window === "undefined") return SERVER_SNAPSHOT;
  if (!current) current = load();
  return current;
}

function onStorage(e: StorageEvent) {
  if (e.key !== STORAGE_KEY && e.key !== null) return;
  current = load();
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  if (listeners.size === 1) window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) window.removeEventListener("storage", onStorage);
  };
}

/** Apply a pure update. Saves to localStorage only when something changed. */
export function updateProgress(fn: (s: ProgressState) => ProgressState) {
  const prev = getSnapshot();
  const next = fn(prev);
  if (next === prev) return;
  current = next;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Storage full or blocked (private mode): keep working in memory.
  }
  listeners.forEach((l) => l());
}

export function resetProgress() {
  updateProgress(() => emptyState());
}

export function useProgress(): ProgressState {
  return useSyncExternalStore(subscribe, getSnapshot, () => SERVER_SNAPSHOT);
}

export function newId(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}
