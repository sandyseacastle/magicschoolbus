"use client";

import { useState } from "react";
import { ImageUploader } from "./ImageUploader";
import { PanoramaBrowser } from "./PanoramaBrowser";

interface SceneSourceTabsProps {
  excursionId: string;
  onScenesChanged: () => void;
}

export function SceneSourceTabs({ excursionId, onScenesChanged }: SceneSourceTabsProps) {
  const [tab, setTab] = useState<"upload" | "browse">("upload");

  return (
    <div>
      <div className="flex gap-1 mb-4 bg-surface-alt rounded-xl p-1 border-2 border-border">
        <button
          onClick={() => setTab("upload")}
          className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-bold transition-all ${
            tab === "upload"
              ? "bg-primary text-white shadow-md"
              : "text-muted hover:text-foreground hover:bg-primary-light/50"
          }`}
        >
          Upload Your Own
        </button>
        <button
          onClick={() => setTab("browse")}
          className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-bold transition-all ${
            tab === "browse"
              ? "bg-primary text-white shadow-md"
              : "text-muted hover:text-foreground hover:bg-primary-light/50"
          }`}
        >
          Browse Public
        </button>
      </div>

      {tab === "upload" ? (
        <ImageUploader excursionId={excursionId} onUploadComplete={onScenesChanged} />
      ) : (
        <PanoramaBrowser excursionId={excursionId} onImageAdded={onScenesChanged} />
      )}
    </div>
  );
}
