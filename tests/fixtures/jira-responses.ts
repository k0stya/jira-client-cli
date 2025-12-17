import type { JiraIssue, JiraUser, JiraSearchResult } from '../../src/types/jira.js';

export const mockUser: JiraUser = {
  self: 'https://example.atlassian.net/rest/api/3/user?accountId=123',
  accountId: '123',
  emailAddress: 'test@example.com',
  displayName: 'Test User',
  active: true,
  timeZone: 'America/New_York',
  accountType: 'atlassian',
};

export const mockIssue: JiraIssue = {
  id: '10001',
  key: 'PROJ-123',
  self: 'https://example.atlassian.net/rest/api/3/issue/10001',
  fields: {
    summary: 'Fix login button alignment',
    description: {
      type: 'doc',
      version: 1,
      content: [
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: 'The login button is misaligned on mobile devices.',
            },
          ],
        },
      ],
    },
    status: {
      self: 'https://example.atlassian.net/rest/api/3/status/3',
      description: '',
      iconUrl: 'https://example.atlassian.net/images/icons/status.png',
      name: 'In Progress',
      id: '3',
      statusCategory: {
        self: 'https://example.atlassian.net/rest/api/3/statuscategory/4',
        id: 4,
        key: 'indeterminate',
        colorName: 'yellow',
        name: 'In Progress',
      },
    },
    priority: {
      self: 'https://example.atlassian.net/rest/api/3/priority/2',
      iconUrl: 'https://example.atlassian.net/images/icons/priority.png',
      name: 'High',
      id: '2',
    },
    assignee: {
      self: 'https://example.atlassian.net/rest/api/3/user?accountId=456',
      accountId: '456',
      displayName: 'John Doe',
      active: true,
      accountType: 'atlassian',
    },
    reporter: {
      self: 'https://example.atlassian.net/rest/api/3/user?accountId=789',
      accountId: '789',
      displayName: 'Jane Smith',
      active: true,
      accountType: 'atlassian',
    },
    created: '2024-01-10T10:00:00.000Z',
    updated: '2024-01-14T15:30:00.000Z',
    issuetype: {
      self: 'https://example.atlassian.net/rest/api/3/issuetype/1',
      id: '1',
      description: 'A problem or bug',
      iconUrl: 'https://example.atlassian.net/images/icons/issuetypes/bug.png',
      name: 'Bug',
      subtask: false,
    },
    project: {
      self: 'https://example.atlassian.net/rest/api/3/project/PROJ',
      id: '10000',
      key: 'PROJ',
      name: 'Test Project',
      projectTypeKey: 'software',
    },
    labels: ['frontend', 'mobile'],
    components: [{ name: 'UI' }],
  },
};

export const mockSearchResult: JiraSearchResult = {
  expand: 'schema,names',
  startAt: 0,
  maxResults: 50,
  total: 1,
  issues: [mockIssue],
};

export const mockErrorResponse = {
  errorMessages: ['Issue does not exist or you do not have permission to see it.'],
  errors: {},
};
