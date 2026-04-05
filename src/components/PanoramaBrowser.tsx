"use client";

import { useState, useCallback } from "react";
import { PanoramaResultCard } from "./PanoramaResultCard";
import type { PanoramaSearchResult, PanoramaSearchResponse } from "@/types";

interface PanoramaBrowserProps {
  excursionId: string;
  onImageAdded: () => void;
}

export function PanoramaBrowser({ excursionId, onImageAdded }: PanoramaBrowserProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PanoramaSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searched, setSearched] = useState(false);
  const [location, setLocation] = useState<{ lat: number; lng: number; displayName: string } | null>(null);
  const [addingIds, setAddingIds] = useState<Set<string>>(new Set());
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());
  const [availableSources, setAvailableSources] = useState<string[]>(["wikimedia"]);
  const [source, setSource] = useState("wikimedia");

  const search = useCallback(async () => {
    const q = query.trim();
    if (!q) return;

    setLoading(true);
    setError("");
    setSearched(true);

    try {
      const res = await fetch(`/api/panoramas/search?q=${encodeURIComponent(q)}&source=${source}`);
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Search failed");
      }
      const data: PanoramaSearchResponse = await res.json();
      setResults(data.results);
      setLocation(data.location || null);
      if (data.availableSources) setAvailableSources(data.availableSources);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Search failed. Please try again.");
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [query, source]);

  const addImage = useCallback(
    async (result: PanoramaSearchResult) => {
      if (addingIds.has(result.id) || addedIds.has(result.id)) return;

      setAddingIds((prev) => new Set(prev).add(result.id));

      try {
        const res = await fetch(`/api/excursions/${excursionId}/scenes/from-url`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            url: result.fullUrl,
            title: result.title,
            description: result.description || undefined,
          }),
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Failed to add image");
        }

        setAddedIds((prev) => new Set(prev).add(result.id));
        onImageAdded();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to add image");
      } finally {
        setAddingIds((prev) => {
          const next = new Set(prev);
          next.delete(result.id);
          return next;
        });
      }
    },
    [excursionId, addingIds, addedIds, onImageAdded]
  );

  return (
    <div className="space-y-4">
      {/* Source selector */}
      {availableSources.length > 1 && (
        <div className="flex items-center gap-2">
          <label className="text-xs font-bold text-muted uppercase tracking-wider">Source:</label>
          <div className="flex gap-1">
            {availableSources.map((s) => (
              <button
                key={s}
                onClick={() => setSource(s)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  source === s
                    ? "bg-primary text-white shadow-md"
                    : "text-muted hover:text-foreground hover:bg-primary-light/50"
                }`}
              >
                {s === "wikimedia" ? "Wikimedia" : s === "google" ? "Street View" : "Mapillary"}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Search bar */}
      <div className="flex gap-2">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") search();
          }}
          placeholder="Search for a place... (e.g., Grand Canyon, Paris, Great Wall)"
          className="flex-1 px-4 py-3 border-2 border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary text-sm"
        />
        <button
          onClick={search}
          disabled={!query.trim() || loading}
          className="btn-3d px-5 py-3 bg-accent text-white flex items-center gap-1.5"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          Search
        </button>
      </div>

      {/* Location badge */}
      {location && (
        <div className="badge-fun bg-primary-light text-primary w-fit">
          <span>&#127760;</span>
          <span className="text-xs font-medium">Showing results near {location.displayName}</span>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-danger/10 border-2 border-danger/20 rounded-xl p-3 text-danger text-sm font-medium">
          {error}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="text-center py-8">
          <div className="animate-spin w-10 h-10 border-4 border-primary border-t-transparent rounded-full mx-auto mb-3" />
          <p className="text-muted font-medium">Searching for panoramic images...</p>
        </div>
      )}

      {/* Results grid */}
      {!loading && results.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {results.map((result) => (
            <PanoramaResultCard
              key={result.id}
              result={result}
              isAdding={addingIds.has(result.id)}
              isAdded={addedIds.has(result.id)}
              onAdd={() => addImage(result)}
            />
          ))}
        </div>
      )}

      {/* Empty states */}
      {!loading && !error && !searched && (
        <div className="text-center py-8">
          <span className="text-5xl block mb-3">&#129517;</span>
          <p className="text-lg font-bold mb-1">Search for a place</p>
          <p className="text-muted text-sm">
            Find 360° panoramic images from public collections
          </p>
        </div>
      )}

      {!loading && !error && searched && results.length === 0 && (
        <div className="text-center py-8">
          <span className="text-5xl block mb-3">&#128270;</span>
          <p className="text-lg font-bold mb-1">No panoramic images found</p>
          <p className="text-muted text-sm">
            Try a different search term or a well-known landmark
          </p>
        </div>
      )}
    </div>
  );
}
