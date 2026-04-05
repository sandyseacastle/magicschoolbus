import { prisma } from "./db";

export async function generateUniquePin(): Promise<string> {
  for (let attempt = 0; attempt < 10; attempt++) {
    const pin = String(Math.floor(100000 + Math.random() * 900000));
    const existing = await prisma.session.findFirst({
      where: { pin, isActive: true },
    });
    if (!existing) return pin;
  }
  throw new Error("Failed to generate unique PIN");
}
