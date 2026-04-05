import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { getTeacherFromRequest } from "@/lib/auth";
import fs from "fs/promises";
import path from "path";

async function getOwnedExcursion(excursionId: string) {
  const cookieStore = await cookies();
  const teacher = await getTeacherFromRequest(cookieStore);
  if (!teacher) return { error: "Unauthorized" as const, status: 401 };

  const excursion = await prisma.excursion.findUnique({
    where: { id: excursionId },
    include: { scenes: { orderBy: { sortOrder: "asc" } }, sessions: { where: { isActive: true } } },
  });

  if (!excursion) return { error: "Not found" as const, status: 404 };
  if (excursion.teacherId && excursion.teacherId !== teacher.id) {
    return { error: "Forbidden" as const, status: 403 };
  }

  return { excursion, teacher };
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ excursionId: string }> }
) {
  const { excursionId } = await params;
  const result = await getOwnedExcursion(excursionId);
  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }
  return NextResponse.json(result.excursion);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ excursionId: string }> }
) {
  const { excursionId } = await params;
  const result = await getOwnedExcursion(excursionId);
  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  const { title } = await request.json();
  const excursion = await prisma.excursion.update({
    where: { id: excursionId },
    data: { title },
  });
  return NextResponse.json(excursion);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ excursionId: string }> }
) {
  const { excursionId } = await params;
  const result = await getOwnedExcursion(excursionId);
  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  const uploadDir = path.join(process.cwd(), "uploads", excursionId);
  try {
    await fs.rm(uploadDir, { recursive: true });
  } catch {
    // Directory might not exist
  }

  await prisma.excursion.delete({ where: { id: excursionId } });
  return NextResponse.json({ success: true });
}
