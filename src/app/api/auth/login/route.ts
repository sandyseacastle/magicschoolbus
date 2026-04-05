import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { verifyPassword, createSession, setSessionCookie } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const { username, password } = await request.json();

  if (!username || !password) {
    return NextResponse.json(
      { error: "Username and password are required" },
      { status: 400 }
    );
  }

  const teacher = await prisma.teacher.findUnique({
    where: { username: username.trim().toLowerCase() },
  });

  if (!teacher || !(await verifyPassword(password, teacher.passwordHash))) {
    return NextResponse.json(
      { error: "Invalid username or password" },
      { status: 401 }
    );
  }

  const token = await createSession(teacher.id);
  const cookieStore = await cookies();
  setSessionCookie(cookieStore, token);

  return NextResponse.json({ id: teacher.id, username: teacher.username });
}
