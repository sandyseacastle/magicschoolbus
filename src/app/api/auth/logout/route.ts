import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { clearSessionCookie, SESSION_COOKIE_NAME } from "@/lib/auth";

export async function POST() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (token) {
    await prisma.teacherSession.deleteMany({ where: { token } });
  }

  clearSessionCookie(cookieStore);
  return NextResponse.json({ success: true });
}
