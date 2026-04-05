import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import fs from "fs/promises";
import path from "path";
import sharp from "sharp";

const ALLOWED_HOSTS = [
  "upload.wikimedia.org",
  "maps.googleapis.com",
  "scontent.mapillary.com",
  "d1cuyjsrcm0gby.cloudfront.net",
];

const MAX_SIZE = 50 * 1024 * 1024; // 50MB

function getExtFromContentType(contentType: string): string {
  const map: Record<string, string> = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
    "image/gif": ".gif",
  };
  return map[contentType] || ".jpg";
}

function getExtFromUrl(url: string): string {
  const pathname = new URL(url).pathname;
  const ext = path.extname(pathname).toLowerCase();
  if ([".jpg", ".jpeg", ".png", ".webp", ".gif"].includes(ext)) return ext;
  return "";
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ excursionId: string }> }
) {
  const { excursionId } = await params;

  const excursion = await prisma.excursion.findUnique({
    where: { id: excursionId },
    include: { _count: { select: { scenes: true } } },
  });

  if (!excursion) {
    return NextResponse.json({ error: "Excursion not found" }, { status: 404 });
  }

  const body = await request.json();
  const { url, title, description } = body as {
    url: string;
    title?: string;
    description?: string;
  };

  if (!url) {
    return NextResponse.json({ error: "URL is required" }, { status: 400 });
  }

  // Validate URL against whitelist
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(url);
  } catch {
    return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
  }

  if (!ALLOWED_HOSTS.some((host) => parsedUrl.hostname === host || parsedUrl.hostname.endsWith(`.${host}`))) {
    return NextResponse.json({ error: "URL not from a supported source" }, { status: 400 });
  }

  // Download the image
  let imageRes: Response;
  try {
    imageRes = await fetch(url, {
      signal: AbortSignal.timeout(30000),
      headers: {
        "User-Agent": "VRExcursions/1.0 (educational classroom app)",
      },
    });
  } catch {
    return NextResponse.json({ error: "Image download timed out or failed" }, { status: 504 });
  }

  if (!imageRes.ok) {
    return NextResponse.json({ error: "Failed to download image" }, { status: 502 });
  }

  const contentType = imageRes.headers.get("content-type") || "";
  if (!contentType.startsWith("image/")) {
    return NextResponse.json({ error: "URL does not point to an image" }, { status: 400 });
  }

  const contentLength = parseInt(imageRes.headers.get("content-length") || "0", 10);
  if (contentLength > MAX_SIZE) {
    return NextResponse.json({ error: "Image exceeds 50MB size limit" }, { status: 413 });
  }

  const buffer = Buffer.from(await imageRes.arrayBuffer());

  if (buffer.length > MAX_SIZE) {
    return NextResponse.json({ error: "Image exceeds 50MB size limit" }, { status: 413 });
  }

  const ext = getExtFromUrl(url) || getExtFromContentType(contentType);

  const uploadDir = path.join(process.cwd(), "uploads", excursionId);
  await fs.mkdir(uploadDir, { recursive: true });

  // Create scene first to get the ID
  const scene = await prisma.scene.create({
    data: {
      excursionId,
      title: title || "Untitled",
      description: description || null,
      filename: "", // will update
      sourceUrl: url,
      sortOrder: excursion._count.scenes,
    },
  });

  const filename = `${scene.id}${ext}`;
  const thumbFilename = `${scene.id}-thumb${ext}`;

  // Save original
  await fs.writeFile(path.join(uploadDir, filename), buffer);

  // Generate thumbnail
  try {
    await sharp(buffer)
      .resize(400, 200, { fit: "cover" })
      .toFile(path.join(uploadDir, thumbFilename));
  } catch {
    // If sharp fails, skip thumbnail
  }

  // Update scene with filenames
  const updatedScene = await prisma.scene.update({
    where: { id: scene.id },
    data: { filename, thumbFilename },
  });

  return NextResponse.json(updatedScene, { status: 201 });
}
