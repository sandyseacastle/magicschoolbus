import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getTeacherFromRequest } from "@/lib/auth";

export async function GET() {
  const cookieStore = await cookies();
  const teacher = await getTeacherFromRequest(cookieStore);

  if (!teacher) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  return NextResponse.json({ id: teacher.id, username: teacher.username });
}
