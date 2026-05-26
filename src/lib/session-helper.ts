import { prisma } from "@/lib/prisma";

const SESSION_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes

export async function getOrCreateSession(sessionId?: string, customerId?: string) {
  if (sessionId) {
    const existing = await prisma.agentSession.findUnique({
      where: { id: sessionId },
    });
    if (existing) {
      const age = Date.now() - new Date(existing.startedAt).getTime();
      if (age > SESSION_TIMEOUT_MS) {
        await prisma.agentSession.update({
          where: { id: existing.id },
          data: { status: "TIMEOUT" },
        });
        // Fall through to create new session
      } else {
        return existing;
      }
    }
  }

  return prisma.agentSession.create({
    data: {
      customerId: customerId || null,
      status: "ACTIVE",
    },
  });
}
