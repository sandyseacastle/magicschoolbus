export interface Scene {
  id: string;
  title: string | null;
  description: string | null;
  filename: string;
  thumbFilename: string | null;
  sortOrder: number;
}

export interface SceneData extends Scene {
  imageUrl: string;
  thumbUrl: string | null;
}

export interface SessionState {
  sceneIndex: number;
  scene: SceneData;
  totalScenes: number;
}

export function sceneToUrls(scene: Scene, excursionId: string): { imageUrl: string; thumbUrl: string | null } {
  return {
    imageUrl: `/api/uploads/${excursionId}/${scene.filename}`,
    thumbUrl: scene.thumbFilename
      ? `/api/uploads/${excursionId}/${scene.thumbFilename}`
      : null,
  };
}

export function sceneToData(scene: Scene, excursionId: string): SceneData {
  return {
    ...scene,
    ...sceneToUrls(scene, excursionId),
  };
}

export interface PanoramaSearchResult {
  id: string;
  title: string;
  description: string;
  thumbUrl: string;
  fullUrl: string;
  width: number;
  height: number;
  license: string;
  source: "wikimedia" | "google" | "mapillary";
}

export interface PanoramaSearchResponse {
  results: PanoramaSearchResult[];
  query: string;
  location?: { lat: number; lng: number; displayName: string };
  hasMore: boolean;
  availableSources: string[];
}
