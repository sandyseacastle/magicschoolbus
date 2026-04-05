"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { SceneSourceTabs } from "@/components/SceneSourceTabs";
import { SceneList } from "@/components/SceneList";
import type { Scene } from "@/types";

export default function CreateExcursionPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [excursionId, setExcursionId] = useState<string | null>(null);
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [creating, setCreating] = useState(false);

  async function createExcursion() {
    if (!title.trim()) return;
    setCreating(true);
    const res = await fetch("/api/excursions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: title.trim() }),
    });
    const data = await res.json();
    setExcursionId(data.id);
    setCreating(false);
  }

  const refreshScenes = useCallback(async () => {
    if (!excursionId) return;
    const res = await fetch(`/api/excursions/${excursionId}`);
    const data = await res.json();
    setScenes(data.scenes || []);
  }, [excursionId]);

  async function deleteScene(sceneId: string) {
    await fetch(`/api/excursions/${excursionId}/scenes/${sceneId}`, {
      method: "DELETE",
    });
    refreshScenes();
  }

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
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <span>&#127912;</span> Create New Excursion
          </h1>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8 space-y-8">
        {/* Step 1: Title */}
        <section className="sticker-card p-6">
          <label className="block text-sm font-bold mb-2 text-primary uppercase tracking-wider">
            <span className="mr-1">&#9312;</span> Name Your Adventure
          </label>
          <div className="flex gap-3">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Ancient Rome Tour, Ocean Deep Dive..."
              disabled={!!excursionId}
              className="flex-1 px-4 py-3 border-2 border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary disabled:opacity-50 text-lg"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !excursionId) createExcursion();
              }}
            />
            {!excursionId && (
              <button
                onClick={createExcursion}
                disabled={!title.trim() || creating}
                className="btn-3d px-6 py-3 bg-primary text-white"
              >
                {creating ? "Creating..." : "Create!"}
              </button>
            )}
          </div>
        </section>

        {/* Step 2: Upload scenes */}
        {excursionId && (
          <>
            <section className="sticker-card p-6">
              <label className="block text-sm font-bold mb-3 text-primary uppercase tracking-wider">
                <span className="mr-1">&#9313;</span> Add 360° Images
              </label>
              <SceneSourceTabs excursionId={excursionId} onScenesChanged={refreshScenes} />
            </section>

            <section>
              <div className="flex items-center justify-between mb-3">
                <label className="block text-sm font-bold text-primary uppercase tracking-wider">
                  <span className="mr-1">&#9314;</span> Your Scenes ({scenes.length})
                </label>
              </div>
              <SceneList
                excursionId={excursionId}
                scenes={scenes}
                onReorder={refreshScenes}
                onDelete={deleteScene}
              />
            </section>

            {scenes.length > 0 && (
              <button
                onClick={() => router.push(`/teacher/${excursionId}`)}
                className="btn-3d w-full py-4 bg-accent text-white text-lg flex items-center justify-center gap-2"
              >
                Continue to Excursion <span>&#128640;</span>
              </button>
            )}
          </>
        )}
      </main>
    </div>
  );
}
