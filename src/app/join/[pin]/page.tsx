"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useSocket } from "@/hooks/useSocket";
import dynamic from "next/dynamic";
import type { SceneData, SessionState } from "@/types";

const AFrameViewer = dynamic(
  () => import("@/components/AFrameViewer").then((m) => m.AFrameViewer),
  { ssr: false }
);

export default function StudentViewerPage() {
  const params = useParams();
  const pin = params.pin as string;
  const { socket, connected } = useSocket();

  const [scene, setScene] = useState<SceneData | null>(null);
  const [scenes, setScenes] = useState<SceneData[]>([]);
  const [excursionTitle, setExcursionTitle] = useState("");
  const [ended, setEnded] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const joinedRef = useRef(false);

  const validateSession = useCallback(async () => {
    const res = await fetch(`/api/sessions/${pin}`);
    if (!res.ok) {
      setError("Session not found or expired.");
      setLoading(false);
      return;
    }
    const data = await res.json();
    setExcursionTitle(data.excursionTitle);

    setScenes(data.scenes);
    if (data.scenes[data.currentScene]) {
      setScene(data.scenes[data.currentScene]);
    }
    setLoading(false);
  }, [pin]);

  useEffect(() => {
    validateSession();
  }, [validateSession]);

  // Preload all scene images into browser cache
  useEffect(() => {
    if (scenes.length === 0) return;
    const images: HTMLImageElement[] = [];
    for (const s of scenes) {
      const img = new Image();
      img.src = s.imageUrl;
      images.push(img);
    }
    return () => {
      for (const img of images) {
        img.removeAttribute("src");
      }
    };
  }, [scenes]);

  useEffect(() => {
    if (!socket || !connected) return;

    const onCurrentState = (state: SessionState) => {
      setScene(state.scene);
    };
    const onSceneChanged = (data: { scene: SceneData }) => {
      setScene(data.scene);
    };
    const onEnded = () => {
      setEnded(true);
    };

    socket.on("session:current-state", onCurrentState);
    socket.on("session:scene-changed", onSceneChanged);
    socket.on("session:ended", onEnded);

    // Only emit join once — listeners must be re-registered on every effect run
    // (React strict mode removes them on cleanup, then re-runs the effect)
    if (!joinedRef.current) {
      joinedRef.current = true;
      socket.emit("student:join", { pin });
    }

    return () => {
      socket.off("session:current-state", onCurrentState);
      socket.off("session:scene-changed", onSceneChanged);
      socket.off("session:ended", onEnded);
    };
  }, [socket, connected, pin]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center hero-gradient px-4">
        <div className="text-center text-white">
          <span className="text-6xl block mb-4 animate-bounce">&#127758;</span>
          <div className="animate-spin w-10 h-10 border-4 border-white border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-xl font-bold" style={{ textShadow: "2px 2px 0 rgba(30,41,59,0.3)" }}>Preparing your adventure...</p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 mt-6 text-sm text-blue-100/80 hover:text-white transition-colors font-bold"
          >
            <span>&#8592;</span> Back to Home
          </Link>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center hero-gradient px-4">
        <div className="sticker-card p-8 max-w-sm text-center">
          <span className="text-5xl block mb-4">&#128532;</span>
          <p className="text-danger text-lg font-bold mb-4">{error}</p>
          <Link
            href="/"
            className="btn-3d inline-flex items-center gap-2 px-6 py-2.5 bg-accent text-white"
          >
            <span>&#127968;</span> Back to Home
          </Link>
        </div>
      </div>
    );
  }

  if (ended) {
    return (
      <div className="min-h-screen flex items-center justify-center hero-gradient px-4">
        <div className="sticker-card p-8 max-w-sm text-center">
          <span className="text-5xl block mb-4">&#127881;</span>
          <h2 className="text-2xl font-bold mb-2">Adventure Complete!</h2>
          <p className="text-muted mb-6">
            The {excursionTitle} excursion has ended. Hope you had fun!
          </p>
          <Link
            href="/"
            className="btn-3d inline-flex items-center gap-2 px-6 py-2.5 bg-accent text-white"
          >
            <span>&#127968;</span> Back to Home
          </Link>
        </div>
      </div>
    );
  }

  if (!scene) {
    return (
      <div className="min-h-screen flex items-center justify-center hero-gradient px-4">
        <div className="text-center text-white">
          <span className="text-6xl block mb-4 animate-bounce">&#9203;</span>
          <p className="text-xl font-bold" style={{ textShadow: "2px 2px 0 rgba(30,41,59,0.3)" }}>Waiting for your teacher to start...</p>
          <p className="text-blue-100/80 mt-2">Get ready for something amazing!</p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 mt-6 text-sm text-blue-100/80 hover:text-white transition-colors font-bold"
          >
            <span>&#8592;</span> Back to Home
          </Link>
        </div>
      </div>
    );
  }

  return <AFrameViewer imageUrl={scene.imageUrl} sceneTitle={scene.title} sceneDescription={scene.description} />;
}
