export interface JiraUser {
  self: string;
  accountId: string;
  emailAddress?: string;
  displayName: string;
  active: boolean;
  timeZone?: string;
  accountType: string;
}

export interface JiraStatus {
  self: string;
  description: string;
  iconUrl: string;
  name: string;
  id: string;
  statusCategory: {
    self: string;
    id: number;
    key: string;
    colorName: string;
    name: string;
  };
}

export interface JiraPriority {
  self: string;
  iconUrl: string;
  name: string;
  id: string;
}

export interface JiraIssueType {
  self: string;
  id: string;
  description: string;
  iconUrl: string;
  name: string;
  subtask: boolean;
}

export interface JiraProject {
  self: string;
  id: string;
  key: string;
  name: string;
  projectTypeKey: string;
}

export interface JiraIssueFields {
  summary: string;
  description: unknown;
  status: JiraStatus;
  priority: JiraPriority | null;
  assignee: JiraUser | null;
  reporter: JiraUser | null;
  created: string;
  updated: string;
  issuetype: JiraIssueType;
  project: JiraProject;
  labels: string[];
  components: Array<{ name: string }>;
}

export interface JiraIssue {
  id: string;
  key: string;
  self: string;
  fields: JiraIssueFields;
}

export interface JiraSearchResult {
  expand: string;
  startAt: number;
  maxResults: number;
  total: number;
  issues: JiraIssue[];
}

export interface JiraErrorResponse {
  errorMessages: string[];
  errors: Record<string, string>;
}
