import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { sceneToData } from "@/types";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ pin: string }> }
) {
  const { pin } = await params;

  const session = await prisma.session.findUnique({
    where: { pin },
    include: {
      excursion: {
        include: { scenes: { orderBy: { sortOrder: "asc" } } },
      },
    },
  });

  if (!session || !session.isActive || session.expiresAt < new Date()) {
    return NextResponse.json({ error: "Session not found or expired" }, { status: 404 });
  }

  const scenes = session.excursion.scenes.map((scene) =>
    sceneToData(scene, session.excursionId)
  );

  return NextResponse.json({
    pin: session.pin,
    excursionTitle: session.excursion.title,
    currentScene: session.currentScene,
    scenes,
  });
}
