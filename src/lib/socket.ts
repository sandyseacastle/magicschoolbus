import { Server as SocketIOServer } from "socket.io";
import type { Server as HTTPServer } from "http";
import { prisma } from "./db";
import { sceneToData } from "@/types";

const studentRooms = new Map<string, Set<string>>();
const teacherSockets = new Map<string, string>(); // pin -> socketId

export function setupSocketIO(httpServer: HTTPServer): SocketIOServer {
  const io = new SocketIOServer(httpServer, {
    path: "/socket.io",
    cors: { origin: "*" },
  });

  io.on("connection", (socket) => {
    let currentPin: string | null = null;
    let role: "teacher" | "student" | null = null;

    socket.on("teacher:start-session", async ({ pin }: { pin: string }) => {
      currentPin = pin;
      role = "teacher";
      teacherSockets.set(pin, socket.id);
      socket.join(pin);

      const students = studentRooms.get(pin);
      socket.emit("session:student-count", { count: students?.size ?? 0 });
    });

    socket.on("teacher:change-scene", async ({ pin, sceneIndex }: { pin: string; sceneIndex: number }) => {
      const session = await prisma.session.findUnique({
        where: { pin },
        include: {
          excursion: {
            include: { scenes: { orderBy: { sortOrder: "asc" } } },
          },
        },
      });

      if (!session || !session.isActive) return;

      const scenes = session.excursion.scenes;
      if (sceneIndex < 0 || sceneIndex >= scenes.length) return;

      const scene = scenes[sceneIndex];

      // Broadcast immediately -- don't block on the DB write
      io.to(pin).emit("session:scene-changed", {
        sceneIndex,
        scene: sceneToData(scene, session.excursionId),
        totalScenes: scenes.length,
      });

      // Persist asynchronously so late-joining students get the right scene
      prisma.session.update({
        where: { pin },
        data: { currentScene: sceneIndex },
      }).catch((err) => {
        console.error(`Failed to persist currentScene for pin=${pin}:`, err);
      });
    });

    socket.on("teacher:end-session", async ({ pin }: { pin: string }) => {
      await prisma.session.update({
        where: { pin },
        data: { isActive: false },
      });

      io.to(pin).emit("session:ended", {});
      studentRooms.delete(pin);
      teacherSockets.delete(pin);
    });

    socket.on("student:join", async ({ pin }: { pin: string }) => {
      currentPin = pin;
      role = "student";
      socket.join(pin);

      if (!studentRooms.has(pin)) {
        studentRooms.set(pin, new Set());
      }
      studentRooms.get(pin)!.add(socket.id);

      // Notify teacher of updated count
      const teacherSocketId = teacherSockets.get(pin);
      if (teacherSocketId) {
        io.to(teacherSocketId).emit("session:student-count", {
          count: studentRooms.get(pin)!.size,
        });
      }

      // Send current state to the joining student
      const session = await prisma.session.findUnique({
        where: { pin },
        include: {
          excursion: {
            include: { scenes: { orderBy: { sortOrder: "asc" } } },
          },
        },
      });

      if (session && session.isActive) {
        const scenes = session.excursion.scenes;
        const idx = session.currentScene;
        if (scenes[idx]) {
          socket.emit("session:current-state", {
            sceneIndex: idx,
            scene: sceneToData(scenes[idx], session.excursionId),
            totalScenes: scenes.length,
          });
        }
      }
    });

    socket.on("disconnect", () => {
      if (role === "student" && currentPin) {
        const room = studentRooms.get(currentPin);
        if (room) {
          room.delete(socket.id);
          const teacherSocketId = teacherSockets.get(currentPin);
          if (teacherSocketId) {
            io.to(teacherSocketId).emit("session:student-count", {
              count: room.size,
            });
          }
          if (room.size === 0) studentRooms.delete(currentPin);
        }
      }
      if (role === "teacher" && currentPin) {
        teacherSockets.delete(currentPin);
      }
    });
  });

  return io;
}
