import { prisma } from "@/lib/prisma";

export async function getOrCreateSession(sessionId?: string, customerId?: string) {
  if (sessionId) {
    const existing = await prisma.agentSession.findUnique({
      where: { id: sessionId },
    });
    if (existing) return existing;
  }

  return prisma.agentSession.create({
    data: {
      customerId: customerId || null,
      status: "ACTIVE",
    },
  });
}
