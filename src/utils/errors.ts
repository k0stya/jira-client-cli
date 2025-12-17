export class JiraCliError extends Error {
  constructor(
    message: string,
    public code: string
  ) {
    super(message);
    this.name = 'JiraCliError';
  }
}

export class AuthenticationError extends JiraCliError {
  constructor(message = 'Authentication failed. Check your credentials.') {
    super(message, 'AUTH_ERROR');
    this.name = 'AuthenticationError';
  }
}

export class NotFoundError extends JiraCliError {
  constructor(message = 'Resource not found.') {
    super(message, 'NOT_FOUND');
    this.name = 'NotFoundError';
  }
}

export class PermissionError extends JiraCliError {
  constructor(message = 'Permission denied.') {
    super(message, 'PERMISSION_DENIED');
    this.name = 'PermissionError';
  }
}

export class RateLimitError extends JiraCliError {
  constructor(message = 'Rate limited. Please try again later.') {
    super(message, 'RATE_LIMITED');
    this.name = 'RateLimitError';
  }
}

export class NoProfileError extends JiraCliError {
  constructor() {
    super('No active profile configured. Run "jira-cli profile create" first.', 'NO_PROFILE');
    this.name = 'NoProfileError';
  }
}

export class JiraApiError extends JiraCliError {
  constructor(
    message: string,
    public statusCode: number
  ) {
    super(message, 'API_ERROR');
    this.name = 'JiraApiError';
  }
}
