import { describe, it, expect, vi, beforeEach } from 'vitest';
import { JiraApiClient } from '../../src/services/jira-api.js';
import { mockIssue, mockUser } from '../fixtures/jira-responses.js';
import type { Profile } from '../../src/types/config.js';
import { AuthenticationError, NotFoundError, RateLimitError } from '../../src/utils/errors.js';

describe('JiraApiClient', () => {
  const testProfile: Profile = {
    name: 'test',
    domain: 'test.atlassian.net',
    email: 'test@example.com',
    token: 'test-token',
    createdAt: '2024-01-01T00:00:00.000Z',
  };

  beforeEach(() => {
    vi.resetAllMocks();
    global.fetch = vi.fn();
  });

  describe('validateConnection', () => {
    it('should return user info when credentials are valid', async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockUser),
      } as Response);

      const client = new JiraApiClient(testProfile);
      const user = await client.validateConnection();

      expect(user.displayName).toBe('Test User');
      expect(global.fetch).toHaveBeenCalledWith(
        'https://test.atlassian.net/rest/api/3/myself',
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: expect.stringContaining('Basic'),
          }),
        })
      );
    });

    it('should throw AuthenticationError on 401', async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        json: () => Promise.resolve({ errorMessages: ['Unauthorized'] }),
      } as Response);

      const client = new JiraApiClient(testProfile);

      await expect(client.validateConnection()).rejects.toThrow(AuthenticationError);
    });
  });

  describe('getIssue', () => {
    it('should fetch issue by key', async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockIssue),
      } as Response);

      const client = new JiraApiClient(testProfile);
      const issue = await client.getIssue('PROJ-123');

      expect(issue.key).toBe('PROJ-123');
      expect(issue.fields.summary).toBe('Fix login button alignment');
    });

    it('should throw NotFoundError on 404', async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        json: () =>
          Promise.resolve({
            errorMessages: ['Issue does not exist or you do not have permission to see it.'],
          }),
      } as Response);

      const client = new JiraApiClient(testProfile);

      await expect(client.getIssue('INVALID-123')).rejects.toThrow(NotFoundError);
    });

    it('should throw RateLimitError on 429', async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: false,
        status: 429,
        statusText: 'Too Many Requests',
        json: () => Promise.resolve({ errorMessages: ['Rate limit exceeded'] }),
      } as Response);

      const client = new JiraApiClient(testProfile);

      await expect(client.getIssue('PROJ-123')).rejects.toThrow(RateLimitError);
    });
  });

  describe('searchIssues', () => {
    it('should search issues with JQL using GET', async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            issues: [mockIssue],
            total: 1,
            startAt: 0,
            maxResults: 50,
          }),
      } as Response);

      const client = new JiraApiClient(testProfile);
      const result = await client.searchIssues('project = PROJ');

      expect(result.issues).toHaveLength(1);
      expect(result.issues[0].key).toBe('PROJ-123');

      // Verify GET request to /search/jql endpoint with query params
      const fetchCall = vi.mocked(global.fetch).mock.calls[0];
      const url = fetchCall[0] as string;
      expect(url).toContain('/search/jql?');
      expect(url).toContain('jql=project');
      expect(url).toContain('maxResults=50');
      expect(url).toContain('startAt=0');
    });
  });
});
