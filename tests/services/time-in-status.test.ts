import { describe, it, expect } from 'vitest';
import {
  calculateTimeInStatus,
  formatDurationHMS,
  formatDurationDays,
  generateCSV,
} from '../../src/services/time-in-status.js';
import type { JiraIssueWithChangelog } from '../../src/types/jira.js';

describe('Time in Status Service', () => {
  describe('formatDurationHMS', () => {
    it('should format milliseconds to H:MM:SS', () => {
      expect(formatDurationHMS(3661000)).toBe('1:01:01'); // 1 hour, 1 min, 1 sec
      expect(formatDurationHMS(7200000)).toBe('2:00:00'); // 2 hours
      expect(formatDurationHMS(90000)).toBe('0:01:30'); // 1.5 minutes
    });

    it('should return empty string for zero or negative', () => {
      expect(formatDurationHMS(0)).toBe('');
      expect(formatDurationHMS(-1000)).toBe('');
    });
  });

  describe('formatDurationDays', () => {
    it('should format milliseconds to days with 2 decimals', () => {
      const oneDay = 24 * 60 * 60 * 1000;
      expect(formatDurationDays(oneDay)).toBe('1.00');
      expect(formatDurationDays(oneDay / 2)).toBe('0.50');
    });

    it('should return empty string for zero or negative', () => {
      expect(formatDurationDays(0)).toBe('');
      expect(formatDurationDays(-1000)).toBe('');
    });
  });

  describe('calculateTimeInStatus', () => {
    it('should calculate time in status from changelog', () => {
      const issue: JiraIssueWithChangelog = {
        id: '1',
        key: 'TEST-1',
        self: 'https://example.atlassian.net/rest/api/3/issue/1',
        fields: {
          summary: 'Test issue',
          description: null,
          status: {
            self: '',
            description: '',
            iconUrl: '',
            name: 'Done',
            id: '3',
            statusCategory: { self: '', id: 3, key: 'done', colorName: 'green', name: 'Done' },
          },
          priority: null,
          assignee: null,
          reporter: null,
          created: '2024-01-01T10:00:00.000Z',
          updated: '2024-01-01T14:00:00.000Z',
          issuetype: { self: '', id: '1', description: '', iconUrl: '', name: 'Task', subtask: false },
          project: { self: '', id: '1', key: 'TEST', name: 'Test', projectTypeKey: 'software' },
          labels: [],
          components: [],
        },
        changelog: {
          startAt: 0,
          maxResults: 100,
          total: 2,
          histories: [
            {
              id: '1',
              author: { self: '', accountId: '1', displayName: 'User', active: true, accountType: 'atlassian' },
              created: '2024-01-01T11:00:00.000Z',
              items: [
                {
                  field: 'status',
                  fieldtype: 'jira',
                  from: '1',
                  fromString: 'To Do',
                  to: '2',
                  toString: 'In Progress',
                },
              ],
            },
            {
              id: '2',
              author: { self: '', accountId: '1', displayName: 'User', active: true, accountType: 'atlassian' },
              created: '2024-01-01T13:00:00.000Z',
              items: [
                {
                  field: 'status',
                  fieldtype: 'jira',
                  from: '2',
                  fromString: 'In Progress',
                  to: '3',
                  toString: 'Done',
                },
              ],
            },
          ],
        },
      };

      const report = calculateTimeInStatus([issue]);

      expect(report.issues).toHaveLength(1);
      expect(report.allStatuses).toContain('To Do');
      expect(report.allStatuses).toContain('In Progress');
      expect(report.allStatuses).toContain('Done');

      const issueDurations = report.issues[0].statusDurations;

      // To Do: 10:00 to 11:00 = 1 hour = 3600000ms
      expect(issueDurations.get('To Do')).toBe(3600000);

      // In Progress: 11:00 to 13:00 = 2 hours = 7200000ms
      expect(issueDurations.get('In Progress')).toBe(7200000);

      // Done: 13:00 to now (will be > 0)
      expect(issueDurations.get('Done')).toBeGreaterThan(0);
    });

    it('should handle issue with no changelog', () => {
      const issue: JiraIssueWithChangelog = {
        id: '1',
        key: 'TEST-1',
        self: '',
        fields: {
          summary: 'Test issue',
          description: null,
          status: {
            self: '',
            description: '',
            iconUrl: '',
            name: 'To Do',
            id: '1',
            statusCategory: { self: '', id: 1, key: 'new', colorName: 'blue', name: 'To Do' },
          },
          priority: null,
          assignee: null,
          reporter: null,
          created: '2024-01-01T10:00:00.000Z',
          updated: '2024-01-01T10:00:00.000Z',
          issuetype: { self: '', id: '1', description: '', iconUrl: '', name: 'Task', subtask: false },
          project: { self: '', id: '1', key: 'TEST', name: 'Test', projectTypeKey: 'software' },
          labels: [],
          components: [],
        },
      };

      const report = calculateTimeInStatus([issue]);

      expect(report.issues).toHaveLength(1);
      expect(report.allStatuses).toContain('To Do');
      expect(report.issues[0].statusDurations.get('To Do')).toBeGreaterThan(0);
    });
  });

  describe('generateCSV', () => {
    it('should generate valid CSV output', () => {
      const report = {
        issues: [
          {
            issueKey: 'TEST-1',
            statusDurations: new Map([
              ['To Do', 3600000],
              ['In Progress', 7200000],
            ]),
          },
        ],
        allStatuses: ['To Do', 'In Progress'],
        totals: new Map([
          ['To Do', 3600000],
          ['In Progress', 7200000],
        ]),
        averages: new Map([
          ['To Do', 3600000],
          ['In Progress', 7200000],
        ]),
        medians: new Map([
          ['To Do', 3600000],
          ['In Progress', 7200000],
        ]),
      };

      const csv = generateCSV(report);

      expect(csv).toContain('TICKET ID,To Do,In Progress');
      expect(csv).toContain('TEST-1,1:00:00,2:00:00');
      expect(csv).toContain('"Total, h"');
      expect(csv).toContain('"Average, h"');
      expect(csv).toContain('"Median, h"');
    });
  });
});
