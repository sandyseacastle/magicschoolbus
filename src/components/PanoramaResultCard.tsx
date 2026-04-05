"use client";

import type { PanoramaSearchResult } from "@/types";

interface PanoramaResultCardProps {
  result: PanoramaSearchResult;
  isAdding: boolean;
  isAdded: boolean;
  onAdd: () => void;
}

export function PanoramaResultCard({ result, isAdding, isAdded, onAdd }: PanoramaResultCardProps) {
  return (
    <div className="sticker-card overflow-hidden flex flex-col">
      <div className="relative" style={{ aspectRatio: "2 / 1" }}>
        <img
          src={result.thumbUrl}
          alt={result.title}
          className="w-full h-full object-cover"
          loading="lazy"
        />
        <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/60 to-transparent p-2">
          <span className="badge-fun bg-white/20 text-white text-[10px] backdrop-blur-sm">
            {result.license}
          </span>
        </div>
      </div>

      <div className="p-3 flex flex-col flex-1">
        <h3 className="font-bold text-sm leading-tight line-clamp-2 mb-1">{result.title}</h3>
        {result.description && (
          <p className="text-xs text-muted line-clamp-1 mb-2">{result.description}</p>
        )}

        <div className="mt-auto pt-2">
          {isAdded ? (
            <button
              disabled
              className="w-full py-2 bg-fun-green text-white rounded-xl font-bold text-sm flex items-center justify-center gap-1.5"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Added!
            </button>
          ) : isAdding ? (
            <button
              disabled
              className="w-full py-2 bg-accent/70 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-1.5"
            >
              <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
              Adding...
            </button>
          ) : (
            <button
              onClick={onAdd}
              className="btn-3d w-full py-2 bg-accent text-white text-sm flex items-center justify-center gap-1.5"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add to Excursion
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
