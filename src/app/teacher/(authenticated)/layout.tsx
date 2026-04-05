import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getTeacherFromRequest } from "@/lib/auth";

export default async function AuthenticatedTeacherLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const teacher = await getTeacherFromRequest(cookieStore);

  if (!teacher) {
    redirect("/teacher/login");
  }

  return <>{children}</>;
}
