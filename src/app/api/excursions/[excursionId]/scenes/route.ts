import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import fs from "fs/promises";
import path from "path";
import sharp from "sharp";

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

  const formData = await request.formData();
  const file = formData.get("image") as File | null;
  const title = formData.get("title") as string | null;

  if (!file) {
    return NextResponse.json({ error: "Image file is required" }, { status: 400 });
  }

  const uploadDir = path.join(process.cwd(), "uploads", excursionId);
  await fs.mkdir(uploadDir, { recursive: true });

  const buffer = Buffer.from(await file.arrayBuffer());
  const ext = path.extname(file.name) || ".jpg";
  const baseName = path.basename(file.name, ext);

  // Create scene first to get the ID
  const scene = await prisma.scene.create({
    data: {
      excursionId,
      title: title || baseName,
      filename: "", // will update
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

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ excursionId: string }> }
) {
  const { excursionId } = await params;
  const { scenes } = await request.json();

  // Batch update sort orders
  if (Array.isArray(scenes)) {
    await Promise.all(
      scenes.map((s: { id: string; sortOrder: number }) =>
        prisma.scene.update({
          where: { id: s.id, excursionId },
          data: { sortOrder: s.sortOrder },
        })
      )
    );
  }

  return NextResponse.json({ success: true });
}
