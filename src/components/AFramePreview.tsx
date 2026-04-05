"use client";

import { useEffect, useRef, useState } from "react";
import { useAFrame, checkWebGLSupport } from "@/hooks/useAFrame";

interface AFramePreviewProps {
  imageUrl: string;
}

export function AFramePreview({ imageUrl }: AFramePreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const loaded = useAFrame();
  const [webglError, setWebglError] = useState(false);

  useEffect(() => {
    if (!loaded || !containerRef.current) return;

    if (!checkWebGLSupport()) {
      setWebglError(true);
      return;
    }

    const container = containerRef.current;

    // Defer scene creation via rAF so React strict mode cleanup
    // can cancel before A-Frame starts initializing (avoids cascading errors)
    const rafId = requestAnimationFrame(() => {
      // Clean up existing scene properly before creating a new one
      const existingScene = container.querySelector("a-scene");
      if (existingScene) {
        existingScene.remove();
      }

      try {
        const scene = document.createElement("a-scene");
        scene.setAttribute("embedded", "");
        scene.setAttribute("vr-mode-ui", "enabled: false");
        scene.setAttribute("loading-screen", "enabled: false");
        scene.style.height = "100%";
        scene.style.width = "100%";

        const sky = document.createElement("a-sky");
        sky.setAttribute("src", imageUrl);
        sky.setAttribute("rotation", "0 -90 0");
        scene.appendChild(sky);

        container.appendChild(scene);
      } catch {
        setWebglError(true);
      }
    });

    return () => {
      cancelAnimationFrame(rafId);
      const sceneEl = container.querySelector("a-scene");
      if (sceneEl) {
        sceneEl.remove();
      }
    };
  }, [loaded, imageUrl]);

  if (webglError) {
    return (
      <div style={{ width: "100%", height: "100%", position: "relative" }}>
        <div className="flex flex-col items-center justify-center h-full bg-surface-alt text-center p-6">
          <p className="text-3xl mb-3">&#9888;&#65039;</p>
          <p className="font-bold text-foreground">WebGL Not Available</p>
          <p className="text-sm text-muted mt-1">360° preview requires WebGL support.</p>
          {imageUrl && (
            <img src={imageUrl} alt="Scene preview" className="mt-4 rounded-lg max-h-40 object-cover" />
          )}
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} style={{ width: "100%", height: "100%", position: "relative" }}>
      {!loaded && (
        <div className="flex items-center justify-center h-full bg-surface-alt">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      )}
    </div>
  );
}
