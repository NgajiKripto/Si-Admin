import { describe, it, expect } from 'vitest';
import { isActionAllowed, ACTION_TYPES } from '@/lib/agent-guard/action-permissions';
import type { ActionType } from '@/lib/agent-guard/action-permissions';

describe('isActionAllowed', () => {
  it('allowed action returns true', () => {
    const result = isActionAllowed('SEND_MESSAGE', {
      readOnlyMode: false,
      allowedActions: ['SEND_MESSAGE'],
    });
    expect(result).toBe(true);
  });

  it('disallowed action returns false', () => {
    const result = isActionAllowed('UPDATE_STOCK', {
      readOnlyMode: false,
      allowedActions: ['SEND_MESSAGE'],
    });
    expect(result).toBe(false);
  });

  it('readOnlyMode blocks all actions', () => {
    const result = isActionAllowed('SEND_MESSAGE', {
      readOnlyMode: true,
      allowedActions: ['SEND_MESSAGE'],
    });
    expect(result).toBe(false);
  });

  it('all ACTION_TYPES can be allowed', () => {
    for (const actionType of ACTION_TYPES) {
      const result = isActionAllowed(actionType, {
        readOnlyMode: false,
        allowedActions: [...ACTION_TYPES] as ActionType[],
      });
      expect(result).toBe(true);
    }
  });

  it('empty allowedActions blocks everything', () => {
    const result = isActionAllowed('SEND_MESSAGE', {
      readOnlyMode: false,
      allowedActions: [],
    });
    expect(result).toBe(false);
  });
});
