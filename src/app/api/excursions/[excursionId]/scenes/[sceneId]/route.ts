import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import fs from "fs/promises";
import path from "path";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ excursionId: string; sceneId: string }> }
) {
  const { excursionId, sceneId } = await params;
  const { title, description } = await request.json();

  const scene = await prisma.scene.update({
    where: { id: sceneId, excursionId },
    data: {
      ...(title !== undefined && { title }),
      ...(description !== undefined && { description }),
    },
  });

  return NextResponse.json(scene);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ excursionId: string; sceneId: string }> }
) {
  const { excursionId, sceneId } = await params;

  const scene = await prisma.scene.findUnique({ where: { id: sceneId } });
  if (scene) {
    const uploadDir = path.join(process.cwd(), "uploads", excursionId);
    try {
      await fs.unlink(path.join(uploadDir, scene.filename));
      if (scene.thumbFilename) {
        await fs.unlink(path.join(uploadDir, scene.thumbFilename));
      }
    } catch {
      // Files might not exist
    }
    await prisma.scene.delete({ where: { id: sceneId } });
  }

  return NextResponse.json({ success: true });
}
