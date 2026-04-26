"use client";

import type { AppState } from "./types";

export const STORAGE_KEY = "persona-trip-council-state";

export const emptyState: AppState = {
  session: null,
  personas: [],
  candidates: [],
  selectedDestination: "",
  messages: [],
  itinerary: null
};

export function loadState(): AppState {
  if (typeof window === "undefined") return emptyState;
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return emptyState;
  try {
    return { ...emptyState, ...JSON.parse(raw) };
  } catch {
    return emptyState;
  }
}

export function saveState(state: AppState) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function clearState() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STORAGE_KEY);
}
