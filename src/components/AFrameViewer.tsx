"use client";

import { useEffect, useRef, useState } from "react";
import { useAFrame, checkWebGLSupport } from "@/hooks/useAFrame";

interface AFrameViewerProps {
  imageUrl: string;
  sceneTitle?: string | null;
  sceneDescription?: string | null;
}

export function AFrameViewer({ imageUrl, sceneTitle, sceneDescription }: AFrameViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const skyRef = useRef<Element | null>(null);
  const loaded = useAFrame();
  const [showInfo, setShowInfo] = useState(true);
  const [imageLoading, setImageLoading] = useState(false);
  const [webglError, setWebglError] = useState(false);

  // Show info overlay when scene changes
  useEffect(() => {
    setShowInfo(true);
    const timer = setTimeout(() => setShowInfo(false), 4000);
    return () => clearTimeout(timer);
  }, [imageUrl, sceneTitle]);

  // Create/update scene — deferred via rAF so React strict mode cleanup
  // can cancel before A-Frame starts initializing (avoids cascading errors)
  useEffect(() => {
    if (!loaded || !containerRef.current) return;

    if (!checkWebGLSupport()) {
      setWebglError(true);
      return;
    }

    const container = containerRef.current;
    let loadingTimeout: ReturnType<typeof setTimeout>;

    const rafId = requestAnimationFrame(() => {
      let scene = container.querySelector("a-scene") as HTMLElement | null;

      const onTextureLoaded = () => setImageLoading(false);
      loadingTimeout = setTimeout(() => setImageLoading(false), 10000);

      try {
        if (!scene) {
          scene = document.createElement("a-scene");
          scene.setAttribute("embedded", "");
          scene.setAttribute("vr-mode-ui", "enabled: true");
          scene.setAttribute("loading-screen", "enabled: false");
          scene.style.position = "fixed";
          scene.style.top = "0";
          scene.style.left = "0";
          scene.style.width = "100vw";
          scene.style.height = "100vh";

          const sky = document.createElement("a-sky");
          setImageLoading(true);
          sky.setAttribute("src", imageUrl);
          sky.setAttribute("rotation", "0 -90 0");
          sky.addEventListener("materialtextureloaded", onTextureLoaded, { once: true });
          skyRef.current = sky;
          scene.appendChild(sky);

          container.appendChild(scene);
        } else if (skyRef.current) {
          setImageLoading(true);
          skyRef.current.addEventListener("materialtextureloaded", onTextureLoaded, { once: true });
          skyRef.current.setAttribute("src", imageUrl);
        }
      } catch {
        setWebglError(true);
        setImageLoading(false);
      }
    });

    return () => {
      cancelAnimationFrame(rafId);
      clearTimeout(loadingTimeout);
    };
  }, [loaded, imageUrl]);

  // Cleanup
  useEffect(() => {
    const container = containerRef.current;
    return () => {
      if (container) {
        const scene = container.querySelector("a-scene");
        if (scene) scene.remove();
      }
    };
  }, []);

  if (webglError) {
    return (
      <div className="fixed inset-0 z-[60] flex items-center justify-center bg-gradient-to-b from-slate-800 to-slate-900">
        <div className="text-center text-white max-w-md px-6">
          <p className="text-5xl mb-4">&#9888;&#65039;</p>
          <h2 className="text-xl font-bold mb-2">WebGL Not Available</h2>
          <p className="text-white/70">
            Your browser or device doesn&apos;t support WebGL, which is required for the 360° VR viewer.
            Try using a different browser or enabling hardware acceleration.
          </p>
          {imageUrl && (
            <img src={imageUrl} alt={sceneTitle || "Scene"} className="mt-6 rounded-xl w-full object-cover max-h-48" />
          )}
        </div>
      </div>
    );
  }

  return (
    <>
      <div ref={containerRef} className="vr-fullscreen" />

      {/* Loading spinner */}
      {imageLoading && (
        <div className="fixed inset-0 z-[55] flex items-center justify-center bg-black/30 pointer-events-none">
          <div className="animate-spin w-12 h-12 border-4 border-white border-t-transparent rounded-full" />
        </div>
      )}

      {/* VR button — A-Frame's built-in button only shows when WebXR detects a device,
          so on Android Chrome without a headset it stays hidden. This button calls
          enterVR() directly, which works for both Cardboard and magic-window mode. */}
      {!imageLoading && (
        <button
          onClick={() => {
            const scene = containerRef.current?.querySelector("a-scene") as (HTMLElement & { enterVR?: () => void }) | null;
            scene?.enterVR?.();
          }}
          className="fixed bottom-4 right-4 z-[60] bg-black/60 hover:bg-black/80 text-white w-12 h-12 rounded-full flex items-center justify-center transition-colors font-bold text-sm"
          title="Enter VR"
        >
          VR
        </button>
      )}

      {/* Scene info overlay */}
      {(sceneTitle || sceneDescription) && (
        <>
          <div
            className={`fixed bottom-20 left-1/2 -translate-x-1/2 bg-black/70 text-white px-6 py-3 rounded-xl text-center z-[60] transition-opacity duration-500 max-w-md ${
              showInfo ? "opacity-100" : "opacity-0 pointer-events-none"
            }`}
          >
            {sceneTitle && <p className="font-semibold text-lg">{sceneTitle}</p>}
            {sceneDescription && <p className="text-sm text-white/80 mt-1">{sceneDescription}</p>}
          </div>
          {!showInfo && (
            <button
              onClick={() => setShowInfo(true)}
              className="fixed bottom-20 right-4 z-[60] bg-black/50 hover:bg-black/70 text-white w-12 h-12 rounded-full flex items-center justify-center transition-colors"
              title="Show scene info"
            >
              <span className="text-lg">&#8505;</span>
            </button>
          )}
        </>
      )}
    </>
  );
}
