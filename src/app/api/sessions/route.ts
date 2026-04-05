import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { generateUniquePin } from "@/lib/pin";

export async function POST(request: NextRequest) {
  const { excursionId } = await request.json();

  const excursion = await prisma.excursion.findUnique({
    where: { id: excursionId },
    include: { _count: { select: { scenes: true } } },
  });

  if (!excursion) {
    return NextResponse.json({ error: "Excursion not found" }, { status: 404 });
  }

  if (excursion._count.scenes === 0) {
    return NextResponse.json({ error: "Excursion has no scenes" }, { status: 400 });
  }

  // Check for existing active session
  const existing = await prisma.session.findFirst({
    where: { excursionId, isActive: true },
  });

  if (existing) {
    return NextResponse.json({
      id: existing.id,
      pin: existing.pin,
      excursionId,
    });
  }

  const pin = await generateUniquePin();
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

  const session = await prisma.session.create({
    data: { excursionId, pin, expiresAt },
  });

  return NextResponse.json({
    id: session.id,
    pin: session.pin,
    excursionId,
  }, { status: 201 });
}
