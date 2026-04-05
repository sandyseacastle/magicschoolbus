import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { hashPassword, createSession, setSessionCookie } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const { username, password } = await request.json();

  if (!username || typeof username !== "string" || username.trim().length < 3) {
    return NextResponse.json(
      { error: "Username must be at least 3 characters" },
      { status: 400 }
    );
  }

  if (!password || typeof password !== "string" || password.length < 6) {
    return NextResponse.json(
      { error: "Password must be at least 6 characters" },
      { status: 400 }
    );
  }

  const existing = await prisma.teacher.findUnique({
    where: { username: username.trim().toLowerCase() },
  });

  if (existing) {
    return NextResponse.json(
      { error: "Username already taken" },
      { status: 409 }
    );
  }

  const passwordHash = await hashPassword(password);
  const teacher = await prisma.teacher.create({
    data: {
      username: username.trim().toLowerCase(),
      passwordHash,
    },
  });

  const token = await createSession(teacher.id);
  const cookieStore = await cookies();
  setSessionCookie(cookieStore, token);

  return NextResponse.json(
    { id: teacher.id, username: teacher.username },
    { status: 201 }
  );
}
