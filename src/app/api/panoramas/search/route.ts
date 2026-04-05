import { NextRequest, NextResponse } from "next/server";
import type { PanoramaSearchResult, PanoramaSearchResponse } from "@/types";

const USER_AGENT = "VRExcursions/1.0 (educational classroom app)";

// Simple in-memory cache (query -> { data, timestamp })
const cache = new Map<string, { data: PanoramaSearchResponse; ts: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

function getAvailableSources(): string[] {
  const sources = ["wikimedia"];
  if (process.env.GOOGLE_MAPS_API_KEY) sources.push("google");
  if (process.env.MAPILLARY_ACCESS_TOKEN) sources.push("mapillary");
  return sources;
}

interface NominatimResult {
  lat: string;
  lon: string;
  display_name: string;
}

async function geocode(query: string): Promise<{ lat: number; lng: number; displayName: string } | null> {
  try {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`;
    const res = await fetch(url, {
      headers: { "User-Agent": USER_AGENT },
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as NominatimResult[];
    if (data.length === 0) return null;
    return {
      lat: parseFloat(data[0].lat),
      lng: parseFloat(data[0].lon),
      displayName: data[0].display_name.split(",").slice(0, 2).join(",").trim(),
    };
  } catch {
    return null;
  }
}

interface WikiImageInfo {
  url?: string;
  thumburl?: string;
  width?: number;
  height?: number;
  mime?: string;
  extmetadata?: {
    ImageDescription?: { value?: string };
    LicenseShortName?: { value?: string };
  };
}

interface WikiPage {
  pageid: number;
  title: string;
  imageinfo?: WikiImageInfo[];
}

interface WikiSearchResult {
  ns: number;
  title: string;
  pageid: number;
}

interface WikiGeoResult {
  pageid: number;
  title: string;
  lat: number;
  lon: number;
}

async function searchWikimedia(
  query: string,
  location: { lat: number; lng: number } | null
): Promise<PanoramaSearchResult[]> {
  const titles = new Set<string>();
  const allPageIds: number[] = [];

  // Strategy 1: Text search in File namespace for panoramic images
  const searchUrl = new URL("https://commons.wikimedia.org/w/api.php");
  searchUrl.searchParams.set("action", "query");
  searchUrl.searchParams.set("list", "search");
  searchUrl.searchParams.set("srnamespace", "6");
  searchUrl.searchParams.set("srsearch", `${query} 360 panorama`);
  searchUrl.searchParams.set("srlimit", "30");
  searchUrl.searchParams.set("format", "json");
  searchUrl.searchParams.set("origin", "*");

  const searches: Promise<void>[] = [];

  searches.push(
    fetch(searchUrl.toString(), {
      headers: { "User-Agent": USER_AGENT },
      signal: AbortSignal.timeout(10000),
    })
      .then((r) => r.json())
      .then((data: { query?: { search?: WikiSearchResult[] } }) => {
        for (const item of data.query?.search || []) {
          if (!titles.has(item.title)) {
            titles.add(item.title);
            allPageIds.push(item.pageid);
          }
        }
      })
      .catch(() => {})
  );

  // Strategy 2: Geosearch if we have coordinates
  if (location) {
    const geoUrl = new URL("https://commons.wikimedia.org/w/api.php");
    geoUrl.searchParams.set("action", "query");
    geoUrl.searchParams.set("list", "geosearch");
    geoUrl.searchParams.set("gscoord", `${location.lat}|${location.lng}`);
    geoUrl.searchParams.set("gsradius", "10000");
    geoUrl.searchParams.set("gsnamespace", "6");
    geoUrl.searchParams.set("gslimit", "30");
    geoUrl.searchParams.set("format", "json");
    geoUrl.searchParams.set("origin", "*");

    searches.push(
      fetch(geoUrl.toString(), {
        headers: { "User-Agent": USER_AGENT },
        signal: AbortSignal.timeout(10000),
      })
        .then((r) => r.json())
        .then((data: { query?: { geosearch?: WikiGeoResult[] } }) => {
          for (const item of data.query?.geosearch || []) {
            if (!titles.has(item.title)) {
              titles.add(item.title);
              allPageIds.push(item.pageid);
            }
          }
        })
        .catch(() => {})
    );
  }

  await Promise.all(searches);

  if (allPageIds.length === 0) return [];

  // Fetch image info for all pages (batch in groups of 50)
  const results: PanoramaSearchResult[] = [];
  const batches = [];
  for (let i = 0; i < allPageIds.length; i += 50) {
    batches.push(allPageIds.slice(i, i + 50));
  }

  for (const batch of batches) {
    const infoUrl = new URL("https://commons.wikimedia.org/w/api.php");
    infoUrl.searchParams.set("action", "query");
    infoUrl.searchParams.set("pageids", batch.join("|"));
    infoUrl.searchParams.set("prop", "imageinfo");
    infoUrl.searchParams.set("iiprop", "url|size|extmetadata|mime");
    infoUrl.searchParams.set("iiurlwidth", "400");
    infoUrl.searchParams.set("format", "json");
    infoUrl.searchParams.set("origin", "*");

    try {
      const res = await fetch(infoUrl.toString(), {
        headers: { "User-Agent": USER_AGENT },
        signal: AbortSignal.timeout(10000),
      });
      const data = (await res.json()) as { query?: { pages?: Record<string, WikiPage> } };
      const pages = data.query?.pages || {};

      for (const page of Object.values(pages)) {
        const info = page.imageinfo?.[0];
        if (!info || !info.url || !info.width || !info.height) continue;

        // Filter: must be an image
        if (!info.mime?.startsWith("image/")) continue;

        // Filter: panoramic aspect ratio (width >= 1.8 * height)
        if (info.width < 1.8 * info.height) continue;

        // Clean up title (remove "File:" prefix)
        const title = page.title.replace(/^File:/, "").replace(/\.[^.]+$/, "").replace(/_/g, " ");

        const description =
          info.extmetadata?.ImageDescription?.value
            ?.replace(/<[^>]*>/g, "")
            .slice(0, 200) || "";

        results.push({
          id: String(page.pageid),
          title,
          description,
          thumbUrl: info.thumburl || info.url,
          fullUrl: info.url,
          width: info.width,
          height: info.height,
          license: info.extmetadata?.LicenseShortName?.value || "Unknown",
          source: "wikimedia",
        });
      }
    } catch {
      // Skip failed batch
    }
  }

  return results;
}

async function searchGoogle(
  query: string,
  location: { lat: number; lng: number; displayName?: string } | null
): Promise<PanoramaSearchResult[]> {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) return [];

  // Need coordinates for Street View
  const coords = location || (await geocode(query));
  if (!coords) return [];

  // Check for Street View coverage at this location
  const metaUrl = `https://maps.googleapis.com/maps/api/streetview/metadata?location=${coords.lat},${coords.lng}&key=${apiKey}`;
  try {
    const res = await fetch(metaUrl, { signal: AbortSignal.timeout(10000) });
    const data = (await res.json()) as { status: string; pano_id?: string; location?: { lat: number; lng: number } };
    if (data.status !== "OK" || !data.pano_id) return [];

    // Generate multiple headings for a virtual "panoramic" effect
    // Street View Static API returns a single view, but we can offer it as a scene
    const thumbUrl = `https://maps.googleapis.com/maps/api/streetview?size=400x200&location=${coords.lat},${coords.lng}&key=${apiKey}`;
    const fullUrl = `https://maps.googleapis.com/maps/api/streetview?size=640x640&location=${coords.lat},${coords.lng}&key=${apiKey}&fov=360`;

    return [
      {
        id: data.pano_id,
        title: `Street View - ${coords.displayName || query}`,
        description: `Google Street View near ${query}`,
        thumbUrl,
        fullUrl,
        width: 640,
        height: 640,
        license: "Google Maps",
        source: "google" as const,
      },
    ];
  } catch {
    return [];
  }
}

interface MapillaryImage {
  id: string;
  computed_geometry?: {
    coordinates?: [number, number];
  };
  thumb_1024_url?: string;
  thumb_2048_url?: string;
  is_pano?: boolean;
  width?: number;
  height?: number;
}

async function searchMapillary(
  query: string,
  location: { lat: number; lng: number; displayName?: string } | null
): Promise<PanoramaSearchResult[]> {
  const token = process.env.MAPILLARY_ACCESS_TOKEN;
  if (!token) return [];

  const coords = location || (await geocode(query));
  if (!coords) return [];

  // Search for panoramic images near the coordinates
  const bbox = [
    coords.lng - 0.05,
    coords.lat - 0.05,
    coords.lng + 0.05,
    coords.lat + 0.05,
  ].join(",");

  const url = `https://graph.mapillary.com/images?fields=id,computed_geometry,thumb_1024_url,thumb_2048_url,is_pano,width,height&bbox=${bbox}&is_pano=true&limit=20&access_token=${token}`;

  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
    if (!res.ok) return [];
    const data = (await res.json()) as { data?: MapillaryImage[] };

    return (data.data || [])
      .filter((img: MapillaryImage) => img.is_pano && img.thumb_2048_url)
      .map((img: MapillaryImage) => ({
        id: String(img.id),
        title: `Panorama near ${coords.displayName || query}`,
        description: `Mapillary street-level panorama`,
        thumbUrl: img.thumb_1024_url || img.thumb_2048_url!,
        fullUrl: img.thumb_2048_url!,
        width: img.width || 2048,
        height: img.height || 1024,
        license: "CC BY-SA",
        source: "mapillary" as const,
      }));
  } catch {
    return [];
  }
}

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q")?.trim();
  const source = request.nextUrl.searchParams.get("source") || "wikimedia";

  if (!q) {
    return NextResponse.json({ error: "Query parameter 'q' is required" }, { status: 400 });
  }

  // Check cache
  const cacheKey = `${source}:${q}`;
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.ts < CACHE_TTL) {
    return NextResponse.json(cached.data);
  }

  // Geocode the query
  const location = await geocode(q);

  // Search based on source
  let results: PanoramaSearchResult[];
  switch (source) {
    case "google":
      results = await searchGoogle(q, location);
      break;
    case "mapillary":
      results = await searchMapillary(q, location);
      break;
    case "wikimedia":
    default:
      results = await searchWikimedia(q, location);
      break;
  }

  const response: PanoramaSearchResponse = {
    results,
    query: q,
    location: location || undefined,
    hasMore: false,
    availableSources: getAvailableSources(),
  };

  // Cache the response
  cache.set(cacheKey, { data: response, ts: Date.now() });

  return NextResponse.json(response);
}
