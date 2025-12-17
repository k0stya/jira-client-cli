import type { Profile } from '../types/config.js';
import type { JiraIssue, JiraSearchResult, JiraUser, JiraIssueWithChangelog } from '../types/jira.js';
import { AuthenticationError, NotFoundError, JiraApiError, RateLimitError, PermissionError } from '../utils/errors.js';

export class JiraApiClient {
  private baseUrl: string;
  private headers: Record<string, string>;

  constructor(profile: Profile) {
    this.baseUrl = `https://${profile.domain}/rest/api/3`;
    const auth = Buffer.from(`${profile.email}:${profile.token}`).toString('base64');
    this.headers = {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    };
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;

    const response = await fetch(url, {
      ...options,
      headers: { ...this.headers, ...options.headers },
    });

    if (!response.ok) {
      await this.handleErrorResponse(response);
    }

    return response.json() as Promise<T>;
  }

  private async handleErrorResponse(response: Response): Promise<never> {
    let errorMessage = response.statusText;

    try {
      const errorBody = (await response.json()) as { errorMessages?: string[]; errors?: Record<string, string> };
      if (errorBody.errorMessages && errorBody.errorMessages.length > 0) {
        errorMessage = errorBody.errorMessages.join(', ');
      } else if (errorBody.errors) {
        errorMessage = Object.values(errorBody.errors).join(', ');
      }
    } catch {
      // Use default status text if we can't parse the error body
    }

    switch (response.status) {
      case 401:
        throw new AuthenticationError('Authentication failed. Your API token may be invalid or expired.');
      case 403:
        throw new PermissionError("Permission denied. You don't have access to this resource.");
      case 404:
        throw new NotFoundError(errorMessage || 'Resource not found.');
      case 429:
        throw new RateLimitError('Rate limited. Please wait a moment and try again.');
      default:
        throw new JiraApiError(`API error (${response.status}): ${errorMessage}`, response.status);
    }
  }

  async validateConnection(): Promise<JiraUser> {
    return this.request<JiraUser>('/myself');
  }

  async getIssue(issueKey: string): Promise<JiraIssue> {
    return this.request<JiraIssue>(`/issue/${encodeURIComponent(issueKey)}`);
  }

  async searchIssues(jql: string, maxResults = 50, startAt = 0): Promise<JiraSearchResult> {
    const params = new URLSearchParams({
      jql,
      maxResults: maxResults.toString(),
      startAt: startAt.toString(),
      fields: 'summary,status,priority,assignee,reporter,created,updated,issuetype,project',
    });
    return this.request<JiraSearchResult>(`/search/jql?${params.toString()}`);
  }

  async getIssueWithChangelog(issueKey: string): Promise<JiraIssueWithChangelog> {
    return this.request<JiraIssueWithChangelog>(
      `/issue/${encodeURIComponent(issueKey)}?expand=changelog&fields=summary,status,created`
    );
  }

  async searchIssuesWithChangelog(
    jql: string,
    maxResults = 50,
    startAt = 0
  ): Promise<{ issues: JiraIssueWithChangelog[]; total: number }> {
    const params = new URLSearchParams({
      jql,
      maxResults: maxResults.toString(),
      startAt: startAt.toString(),
      fields: 'summary,status,created',
      expand: 'changelog',
    });
    const result = await this.request<JiraSearchResult & { issues: JiraIssueWithChangelog[] }>(
      `/search/jql?${params.toString()}`
    );
    return { issues: result.issues, total: result.total };
  }
}
