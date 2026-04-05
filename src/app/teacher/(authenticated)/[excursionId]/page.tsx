"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { SceneSourceTabs } from "@/components/SceneSourceTabs";
import { SceneList } from "@/components/SceneList";
import type { Scene } from "@/types";

interface Excursion {
  id: string;
  title: string;
  scenes: Scene[];
  sessions: { id: string; pin: string; isActive: boolean }[];
}

export default function ExcursionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const excursionId = params.excursionId as string;

  const [excursion, setExcursion] = useState<Excursion | null>(null);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);

  const fetchExcursion = useCallback(async () => {
    const res = await fetch(`/api/excursions/${excursionId}`);
    if (res.ok) {
      const data = await res.json();
      setExcursion(data);
    }
    setLoading(false);
  }, [excursionId]);

  useEffect(() => {
    fetchExcursion();
  }, [fetchExcursion]);

  async function startSession() {
    setStarting(true);
    const res = await fetch("/api/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ excursionId }),
    });
    if (res.ok) {
      router.push(`/teacher/${excursionId}/session`);
    }
    setStarting(false);
  }

  async function deleteScene(sceneId: string) {
    await fetch(`/api/excursions/${excursionId}/scenes/${sceneId}`, { method: "DELETE" });
    fetchExcursion();
  }

  async function deleteExcursion() {
    if (!confirm("Delete this excursion and all its scenes?")) return;
    await fetch(`/api/excursions/${excursionId}`, { method: "DELETE" });
    router.push("/teacher");
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background dotted-bg">
        <div className="text-center">
          <div className="animate-spin w-10 h-10 border-4 border-primary border-t-transparent rounded-full mx-auto mb-3" />
          <p className="text-muted font-bold">Loading adventure...</p>
        </div>
      </div>
    );
  }

  if (!excursion) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background dotted-bg">
        <div className="text-center">
          <span className="text-5xl mb-4 block">&#128269;</span>
          <p className="text-muted text-lg">Excursion not found</p>
        </div>
      </div>
    );
  }

  const activeSession = excursion.sessions.find((s) => s.isActive);

  return (
    <div className="min-h-screen bg-background dotted-bg">
      <header className="bg-surface border-b-[3px] border-border">
        <div className="rainbow-bar" />
        <div className="max-w-3xl mx-auto px-4 py-4">
          <button
            onClick={() => router.push("/teacher")}
            className="text-sm text-muted hover:text-foreground mb-2 inline-flex items-center gap-1 group font-bold"
          >
            <svg className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to adventures
          </button>
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <span>&#127758;</span> {excursion.title}
            </h1>
            <button
              onClick={deleteExcursion}
              className="text-sm text-muted hover:text-danger transition-colors font-bold"
            >
              Delete
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8 space-y-8">
        {/* Start Session */}
        <section className="sticker-card p-6 text-center">
          {activeSession ? (
            <>
              <div className="badge-fun bg-fun-green/10 text-fun-green mx-auto w-fit mb-3">
                <span className="w-2 h-2 bg-fun-green rounded-full animate-pulse" />
                Live Session
              </div>
              <p className="text-4xl font-bold tracking-[0.3em] font-mono text-primary mb-4">
                {activeSession.pin}
              </p>
              <button
                onClick={() => router.push(`/teacher/${excursionId}/session`)}
                className="btn-3d px-8 py-3 bg-primary text-white"
              >
                Open Control Panel
              </button>
            </>
          ) : (
            <>
              <span className="text-4xl mb-3 block">&#127881;</span>
              <h2 className="text-xl font-bold mb-2">Ready to go live?</h2>
              <p className="text-sm text-muted mb-4">
                Start a session and share the PIN with your students to begin the adventure!
              </p>
              <button
                onClick={startSession}
                disabled={starting || excursion.scenes.length === 0}
                className="btn-3d px-8 py-3.5 bg-accent text-white text-lg"
              >
                {starting ? (
                  "Starting..."
                ) : (
                  <span className="flex items-center gap-2">
                    Start Live Session <span>&#128640;</span>
                  </span>
                )}
              </button>
              {excursion.scenes.length === 0 && (
                <p className="text-xs text-danger mt-3 font-bold">Add at least one scene first!</p>
              )}
            </>
          )}
        </section>

        {/* Upload */}
        <section className="sticker-card p-6">
          <label className="block text-sm font-bold mb-3 text-primary uppercase tracking-wider">Add More Scenes</label>
          <SceneSourceTabs excursionId={excursionId} onScenesChanged={fetchExcursion} />
        </section>

        {/* Scenes */}
        <section>
          <label className="block text-sm font-bold mb-3 text-primary uppercase tracking-wider">
            Scenes ({excursion.scenes.length})
          </label>
          <SceneList
            excursionId={excursionId}
            scenes={excursion.scenes}
            onReorder={fetchExcursion}
            onDelete={deleteScene}
          />
        </section>
      </main>
    </div>
  );
}
