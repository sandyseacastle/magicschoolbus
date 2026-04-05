"use client";

import { useSyncExternalStore, useCallback } from "react";

const AFRAME_SRC = "https://aframe.io/releases/1.7.1/aframe.min.js";

let aframeLoaded = false;
const listeners = new Set<() => void>();

function notifyListeners(): void {
  for (const listener of listeners) {
    listener();
  }
}

function loadAFrame(): void {
  if (typeof window === "undefined") return;

  // Check if AFRAME global is already available (script previously loaded)
  if ("AFRAME" in window) {
    aframeLoaded = true;
    return;
  }

  // Script tag exists but hasn't finished loading — wait for it
  const existingScript = document.querySelector(`script[src="${AFRAME_SRC}"]`) as HTMLScriptElement | null;
  if (existingScript) {
    existingScript.addEventListener("load", () => {
      aframeLoaded = true;
      notifyListeners();
    }, { once: true });
    return;
  }

  const script = document.createElement("script");
  script.src = AFRAME_SRC;
  script.onload = () => {
    aframeLoaded = true;
    notifyListeners();
  };
  document.head.appendChild(script);
}

function getSnapshot(): boolean {
  return aframeLoaded;
}

function getServerSnapshot(): boolean {
  return false;
}

export function checkWebGLSupport(): boolean {
  if (typeof document === "undefined") return false;
  try {
    const canvas = document.createElement("canvas");
    return !!(canvas.getContext("webgl2") || canvas.getContext("webgl"));
  } catch {
    return false;
  }
}

export function useAFrame(): boolean {
  const subscribe = useCallback((onStoreChange: () => void) => {
    listeners.add(onStoreChange);
    loadAFrame();
    return () => { listeners.delete(onStoreChange); };
  }, []);

  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
