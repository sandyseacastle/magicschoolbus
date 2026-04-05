"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSocket } from "@/hooks/useSocket";
import { SessionShareBar } from "@/components/SessionShareBar";
import dynamic from "next/dynamic";

import { type Scene, sceneToUrls } from "@/types";

const AFramePreview = dynamic(() => import("@/components/AFramePreview").then((m) => m.AFramePreview), {
  ssr: false,
});

interface SessionData {
  pin: string;
  scenes: Scene[];
}

export default function SessionControlPage() {
  const params = useParams();
  const router = useRouter();
  const excursionId = params.excursionId as string;

  const { socket, connected } = useSocket();
  const [session, setSession] = useState<SessionData | null>(null);
  const [currentScene, setCurrentScene] = useState(0);
  const [studentCount, setStudentCount] = useState(0);
  const [viewMode, setViewMode] = useState<"grid" | "preview">("grid");
  const [loading, setLoading] = useState(true);
  const joinedRef = useRef(false);

  const fetchSession = useCallback(async () => {
    const res = await fetch(`/api/excursions/${excursionId}`);
    if (!res.ok) return;
    const data = await res.json();
    const active = data.sessions?.find((s: { isActive: boolean }) => s.isActive);
    if (active) {
      setSession({ pin: active.pin, scenes: data.scenes });
    }
    setLoading(false);
  }, [excursionId]);

  useEffect(() => {
    fetchSession();
  }, [fetchSession]);

  useEffect(() => {
    if (!socket || !connected || !session) return;

    const onStudentCount = ({ count }: { count: number }) => {
      setStudentCount(count);
    };

    socket.on("session:student-count", onStudentCount);

    // Only emit join once — listeners must be re-registered on every effect run
    // (React strict mode removes them on cleanup, then re-runs the effect)
    if (!joinedRef.current) {
      joinedRef.current = true;
      socket.emit("teacher:start-session", { pin: session.pin });
    }

    return () => {
      socket.off("session:student-count", onStudentCount);
    };
  }, [socket, connected, session]);

  const changeScene = useCallback((index: number) => {
    if (!session || !socket) return;
    if (index < 0 || index >= session.scenes.length) return;
    setCurrentScene(index);
    socket.emit("teacher:change-scene", { pin: session.pin, sceneIndex: index });
  }, [session, socket]);

  // Keyboard shortcuts for scene navigation
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "ArrowLeft") changeScene(currentScene - 1);
      if (e.key === "ArrowRight") changeScene(currentScene + 1);
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [changeScene, currentScene]);

  function endSession() {
    if (!session || !socket) return;
    if (!confirm("End this session? All students will be disconnected.")) return;
    socket.emit("teacher:end-session", { pin: session.pin });
    router.push(`/teacher/${excursionId}`);
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background dotted-bg">
        <div className="text-center">
          <div className="animate-spin w-10 h-10 border-4 border-primary border-t-transparent rounded-full mx-auto mb-3" />
          <p className="text-muted font-bold">Setting up your session...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background dotted-bg">
        <div className="text-center">
          <span className="text-5xl mb-4 block">&#128269;</span>
          <p className="text-muted text-lg">No active session found</p>
        </div>
      </div>
    );
  }

  const currentSceneData = session.scenes[currentScene];
  const imageUrl = currentSceneData
    ? sceneToUrls(currentSceneData, excursionId).imageUrl
    : "";

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="bg-surface border-b-[3px] border-border">
        <div className="rainbow-bar" />
        <div className="px-4 py-3">
          <div className="max-w-6xl mx-auto">
            <SessionShareBar pin={session.pin} studentCount={studentCount} />
          </div>
        </div>
      </header>

      {/* View Mode Toggle + End Session */}
      <div className="bg-surface border-b-2 border-border-light px-4 py-2">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex gap-1 bg-surface-alt rounded-xl p-1 border-2 border-border">
            <button
              onClick={() => setViewMode("grid")}
              className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-colors ${
                viewMode === "grid"
                  ? "bg-primary text-white"
                  : "text-muted hover:text-foreground"
              }`}
            >
              <span className="mr-1">&#127912;</span> Thumbnails
            </button>
            <button
              onClick={() => setViewMode("preview")}
              className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-colors ${
                viewMode === "preview"
                  ? "bg-primary text-white"
                  : "text-muted hover:text-foreground"
              }`}
            >
              <span className="mr-1">&#127760;</span> 360° Preview
            </button>
          </div>
          <button
            onClick={endSession}
            className="px-4 py-1.5 text-sm font-bold text-danger hover:bg-danger/10 rounded-xl transition-colors border-2 border-transparent hover:border-danger/20"
          >
            End Session
          </button>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 overflow-auto dotted-bg">
        <div className="max-w-6xl mx-auto px-4 py-6">
          {viewMode === "grid" ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {session.scenes.map((scene, index) => {
                const urls = sceneToUrls(scene, excursionId);
                const thumbUrl = urls.thumbUrl ?? urls.imageUrl;

                return (
                  <button
                    key={scene.id}
                    onClick={() => changeScene(index)}
                    className={`relative rounded-2xl overflow-hidden border-[3px] transition-all aspect-video ${
                      index === currentScene
                        ? "border-primary ring-2 ring-primary/30 scale-[1.02]"
                        : "border-border hover:border-primary/50"
                    }`}
                    style={index === currentScene ? { boxShadow: "4px 4px 0 rgba(59,130,246,0.3)" } : { boxShadow: "3px 3px 0 #334155" }}
                  >
                    <img
                      src={thumbUrl}
                      alt={scene.title || `Scene ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                      <p className="text-white text-xs font-bold truncate">
                        {index + 1}. {scene.title || "Untitled"}
                      </p>
                    </div>
                    {index === currentScene && (
                      <div className="absolute top-2 right-2 w-4 h-4 bg-fun-yellow rounded-full border-2 border-border animate-pulse" />
                    )}
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="rounded-2xl overflow-hidden border-[3px] border-border" style={{ height: "60vh", boxShadow: "4px 4px 0 #334155" }}>
              <AFramePreview imageUrl={imageUrl} />
            </div>
          )}
        </div>
      </main>

      {/* Navigation Bar */}
      <footer className="border-t-[3px] border-border bg-surface px-4 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <button
            onClick={() => changeScene(currentScene - 1)}
            disabled={currentScene === 0}
            className="btn-3d px-6 py-3 bg-primary text-white"
          >
            <span className="flex items-center gap-1.5">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Previous
            </span>
          </button>

          <div className="text-center">
            <p className="font-bold text-lg">
              {currentSceneData?.title || `Scene ${currentScene + 1}`}
            </p>
            <p className="text-sm text-muted font-bold">
              {currentScene + 1} of {session.scenes.length}
            </p>
          </div>

          <button
            onClick={() => changeScene(currentScene + 1)}
            disabled={currentScene === session.scenes.length - 1}
            className="btn-3d px-6 py-3 bg-primary text-white"
          >
            <span className="flex items-center gap-1.5">
              Next
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </span>
          </button>
        </div>
      </footer>
    </div>
  );
}
