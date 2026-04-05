import Link from "next/link";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { getTeacherFromRequest } from "@/lib/auth";
import { LogoutButton } from "@/components/LogoutButton";

export const dynamic = "force-dynamic";

export default async function TeacherPage() {
  const cookieStore = await cookies();
  const teacher = (await getTeacherFromRequest(cookieStore))!;

  const excursions = await prisma.excursion.findMany({
    where: { teacherId: teacher.id },
    include: { _count: { select: { scenes: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="min-h-screen bg-background dotted-bg">
      {/* Header */}
      <header className="bg-surface border-b-[3px] border-border">
        <div className="rainbow-bar" />
        <div className="max-w-5xl mx-auto px-4 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-2xl bg-fun-yellow flex items-center justify-center border-[3px] border-border"
              style={{ boxShadow: "3px 3px 0 #334155" }}
            >
              <span className="text-2xl">&#127758;</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold">My Excursions</h1>
              <p className="text-sm text-muted">Your virtual adventure collection</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted font-bold">{teacher.username}</span>
            <LogoutButton />
            <Link
              href="/teacher/create"
              className="btn-3d px-5 py-2.5 bg-accent text-white"
            >
              + New Adventure
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        {excursions.length === 0 ? (
          <div className="text-center py-20">
            <div
              className="w-24 h-24 mx-auto mb-6 rounded-full bg-fun-yellow flex items-center justify-center border-[3px] border-border"
              style={{ boxShadow: "4px 4px 0 #334155" }}
            >
              <span className="text-5xl">&#127757;</span>
            </div>
            <h2 className="text-2xl font-bold mb-2">No adventures yet!</h2>
            <p className="text-muted mb-6 text-lg">
              Create your first VR excursion and take your class somewhere amazing
            </p>
            <Link
              href="/teacher/create"
              className="btn-3d inline-flex items-center gap-2 px-8 py-3.5 bg-accent text-white text-lg"
            >
              <span>&#128640;</span>
              Create Your First Excursion
            </Link>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {excursions.map((excursion, i) => {
              const colors = [
                "from-blue-500 to-cyan-400",
                "from-orange-400 to-pink-500",
                "from-emerald-400 to-teal-500",
                "from-yellow-400 to-orange-500",
                "from-pink-400 to-purple-500",
                "from-sky-400 to-indigo-500",
              ];
              const gradientClass = colors[i % colors.length];

              return (
                <Link
                  key={excursion.id}
                  href={`/teacher/${excursion.id}`}
                  className="sticker-card overflow-hidden group"
                >
                  <div className={`h-2 bg-gradient-to-r ${gradientClass}`} />
                  <div className="p-5">
                    <h3 className="font-bold text-lg group-hover:text-primary transition-colors">
                      {excursion.title}
                    </h3>
                    <div className="flex items-center gap-3 mt-3">
                      <span className="badge-fun bg-primary-light text-primary">
                        <span>&#127912;</span>
                        {excursion._count.scenes} scene{excursion._count.scenes !== 1 ? "s" : ""}
                      </span>
                      <span className="text-xs text-muted">
                        {excursion.createdAt.toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
