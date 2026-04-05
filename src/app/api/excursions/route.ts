import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { getTeacherFromRequest } from "@/lib/auth";

export async function GET() {
  const cookieStore = await cookies();
  const teacher = await getTeacherFromRequest(cookieStore);
  if (!teacher) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const excursions = await prisma.excursion.findMany({
    where: { teacherId: teacher.id },
    include: { _count: { select: { scenes: true } } },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(excursions);
}

export async function POST(request: NextRequest) {
  const cookieStore = await cookies();
  const teacher = await getTeacherFromRequest(cookieStore);
  if (!teacher) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { title } = await request.json();
  if (!title || typeof title !== "string") {
    return NextResponse.json({ error: "Title is required" }, { status: 400 });
  }

  const excursion = await prisma.excursion.create({
    data: { title, teacherId: teacher.id },
  });
  return NextResponse.json(excursion, { status: 201 });
}
