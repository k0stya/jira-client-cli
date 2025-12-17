import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  getAllProfiles,
  getProfile,
  getActiveProfile,
  getActiveProfileName,
  createProfile,
  setActiveProfile,
  deleteProfile,
  profileExists,
  maskToken,
} from '../../src/services/config.js';
import type { Profile } from '../../src/types/config.js';

// Mock the conf module
vi.mock('conf', () => {
  let store: Record<string, unknown> = {
    profiles: {},
    activeProfile: '',
  };

  return {
    default: class MockConf {
      constructor() {}

      get(key: string) {
        return store[key];
      }

      set(key: string, value: unknown) {
        store[key] = value;
      }

      static reset() {
        store = {
          profiles: {},
          activeProfile: '',
        };
      }
    },
  };
});

describe('Config Service', () => {
  const testProfile: Profile = {
    name: 'test',
    domain: 'test.atlassian.net',
    email: 'test@example.com',
    token: 'test-token-12345',
    createdAt: '2024-01-01T00:00:00.000Z',
  };

  describe('maskToken', () => {
    it('should mask tokens showing only last 4 characters', () => {
      const result = maskToken('abcdefghijklmnop');
      expect(result).toBe('********************mnop');
    });

    it('should handle short tokens', () => {
      const result = maskToken('abc');
      expect(result).toBe('***');
    });

    it('should handle empty tokens', () => {
      const result = maskToken('');
      expect(result).toBe('');
    });
  });
});
