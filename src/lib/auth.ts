import { randomBytes, scrypt, timingSafeEqual } from "crypto";
import { prisma } from "./db";
import { cookies } from "next/headers";

const SALT_LENGTH = 16;
const KEY_LENGTH = 64;
const SESSION_COOKIE = "teacher_session";
const SESSION_MAX_AGE = 30 * 24 * 60 * 60 * 1000; // 30 days

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(SALT_LENGTH).toString("hex");
  return new Promise((resolve, reject) => {
    scrypt(password, salt, KEY_LENGTH, (err, derivedKey) => {
      if (err) reject(err);
      resolve(`${salt}:${derivedKey.toString("hex")}`);
    });
  });
}

export async function verifyPassword(
  password: string,
  stored: string
): Promise<boolean> {
  const [salt, hash] = stored.split(":");
  return new Promise((resolve, reject) => {
    scrypt(password, salt, KEY_LENGTH, (err, derivedKey) => {
      if (err) reject(err);
      resolve(timingSafeEqual(Buffer.from(hash, "hex"), derivedKey));
    });
  });
}

export async function createSession(teacherId: string): Promise<string> {
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_MAX_AGE);

  await prisma.teacherSession.create({
    data: { teacherId, token, expiresAt },
  });

  return token;
}

export async function getTeacherFromRequest(
  cookieStore: Awaited<ReturnType<typeof cookies>>
) {
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const session = await prisma.teacherSession.findUnique({
    where: { token },
    include: { teacher: true },
  });

  if (!session || session.expiresAt < new Date()) {
    if (session) {
      await prisma.teacherSession.delete({ where: { id: session.id } });
    }
    return null;
  }

  return session.teacher;
}

export function setSessionCookie(
  cookieStore: Awaited<ReturnType<typeof cookies>>,
  token: string
) {
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE / 1000,
  });
}

export function clearSessionCookie(
  cookieStore: Awaited<ReturnType<typeof cookies>>
) {
  cookieStore.delete(SESSION_COOKIE);
}

export const SESSION_COOKIE_NAME = SESSION_COOKIE;
