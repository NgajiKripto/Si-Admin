import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock prisma
vi.mock('@/lib/prisma', () => ({
  prisma: {
    agentSession: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
  },
}));

import { getOrCreateSession } from '@/lib/session-helper';
import { prisma } from '@/lib/prisma';

const mockPrisma = prisma as unknown as {
  agentSession: {
    findUnique: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
  };
};

describe('getOrCreateSession', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns existing session if not expired', async () => {
    const session = {
      id: 'session-1',
      startedAt: new Date(),
      status: 'ACTIVE',
    };
    mockPrisma.agentSession.findUnique.mockResolvedValue(session);

    const result = await getOrCreateSession('session-1');
    expect(result).toEqual(session);
    expect(mockPrisma.agentSession.update).not.toHaveBeenCalled();
    expect(mockPrisma.agentSession.create).not.toHaveBeenCalled();
  });

  it('marks expired session as TIMEOUT and creates new one', async () => {
    const expiredSession = {
      id: 'session-old',
      startedAt: new Date(Date.now() - 31 * 60 * 1000), // 31 minutes ago
      status: 'ACTIVE',
    };
    const newSession = {
      id: 'session-new',
      startedAt: new Date(),
      status: 'ACTIVE',
    };

    mockPrisma.agentSession.findUnique.mockResolvedValue(expiredSession);
    mockPrisma.agentSession.update.mockResolvedValue({ ...expiredSession, status: 'TIMEOUT' });
    mockPrisma.agentSession.create.mockResolvedValue(newSession);

    const result = await getOrCreateSession('session-old');

    expect(mockPrisma.agentSession.update).toHaveBeenCalledWith({
      where: { id: 'session-old' },
      data: { status: 'TIMEOUT' },
    });
    expect(mockPrisma.agentSession.create).toHaveBeenCalled();
    expect(result).toEqual(newSession);
  });

  it('creates new session if sessionId not found', async () => {
    const newSession = { id: 'session-new', startedAt: new Date(), status: 'ACTIVE' };
    mockPrisma.agentSession.findUnique.mockResolvedValue(null);
    mockPrisma.agentSession.create.mockResolvedValue(newSession);

    const result = await getOrCreateSession('nonexistent');
    expect(mockPrisma.agentSession.create).toHaveBeenCalled();
    expect(result).toEqual(newSession);
  });

  it('creates new session if no sessionId provided', async () => {
    const newSession = { id: 'session-new', startedAt: new Date(), status: 'ACTIVE' };
    mockPrisma.agentSession.create.mockResolvedValue(newSession);

    const result = await getOrCreateSession();
    expect(mockPrisma.agentSession.create).toHaveBeenCalledWith({
      data: { customerId: null, status: 'ACTIVE' },
    });
    expect(result).toEqual(newSession);
  });
});
