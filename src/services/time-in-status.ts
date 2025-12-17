import type { JiraIssueWithChangelog, IssueTimeInStatus, TimeInStatusReport } from '../types/jira.js';

export function calculateTimeInStatus(issues: JiraIssueWithChangelog[]): TimeInStatusReport {
  const issueResults: IssueTimeInStatus[] = [];
  const allStatusesSet = new Set<string>();

  for (const issue of issues) {
    const statusDurations = calculateIssueStatusDurations(issue);

    // Collect all statuses
    for (const status of statusDurations.keys()) {
      allStatusesSet.add(status);
    }

    issueResults.push({
      issueKey: issue.key,
      statusDurations,
    });
  }

  const allStatuses = Array.from(allStatusesSet).sort();

  // Calculate totals, averages, and medians
  const totals = calculateTotals(issueResults, allStatuses);
  const averages = calculateAverages(issueResults, allStatuses);
  const medians = calculateMedians(issueResults, allStatuses);

  return {
    issues: issueResults,
    allStatuses,
    totals,
    averages,
    medians,
  };
}

function calculateIssueStatusDurations(issue: JiraIssueWithChangelog): Map<string, number> {
  const statusDurations = new Map<string, number>();

  if (!issue.changelog?.histories) {
    // No changelog, use current status from created time to now
    const currentStatus = issue.fields.status.name;
    const created = new Date(issue.fields.created).getTime();
    const now = Date.now();
    statusDurations.set(currentStatus, now - created);
    return statusDurations;
  }

  // Sort histories by date ascending
  const histories = [...issue.changelog.histories].sort(
    (a, b) => new Date(a.created).getTime() - new Date(b.created).getTime()
  );

  // Track status transitions
  let currentStatus: string | null = null;
  let statusStartTime = new Date(issue.fields.created).getTime();

  // Find the initial status from the first status change (the "from" value)
  for (const history of histories) {
    for (const item of history.items) {
      if (item.field === 'status' && item.fromString) {
        if (currentStatus === null) {
          currentStatus = item.fromString;
        }
        break;
      }
    }
    if (currentStatus !== null) break;
  }

  // If no status changes found, issue has been in current status since creation
  if (currentStatus === null) {
    currentStatus = issue.fields.status.name;
    const duration = Date.now() - statusStartTime;
    statusDurations.set(currentStatus, duration);
    return statusDurations;
  }

  // Process each status change
  for (const history of histories) {
    for (const item of history.items) {
      if (item.field === 'status' && item.fromString && item.toString) {
        const changeTime = new Date(history.created).getTime();

        // Add duration for the previous status
        if (currentStatus) {
          const duration = changeTime - statusStartTime;
          const existing = statusDurations.get(currentStatus) || 0;
          statusDurations.set(currentStatus, existing + duration);
        }

        // Move to new status
        currentStatus = item.toString;
        statusStartTime = changeTime;
      }
    }
  }

  // Add duration for current status (from last change to now)
  if (currentStatus) {
    const duration = Date.now() - statusStartTime;
    const existing = statusDurations.get(currentStatus) || 0;
    statusDurations.set(currentStatus, existing + duration);
  }

  return statusDurations;
}

function calculateTotals(issues: IssueTimeInStatus[], statuses: string[]): Map<string, number> {
  const totals = new Map<string, number>();

  for (const status of statuses) {
    let total = 0;
    for (const issue of issues) {
      total += issue.statusDurations.get(status) || 0;
    }
    totals.set(status, total);
  }

  return totals;
}

function calculateAverages(issues: IssueTimeInStatus[], statuses: string[]): Map<string, number> {
  const averages = new Map<string, number>();

  for (const status of statuses) {
    const values: number[] = [];
    for (const issue of issues) {
      const duration = issue.statusDurations.get(status);
      if (duration !== undefined && duration > 0) {
        values.push(duration);
      }
    }

    if (values.length > 0) {
      const sum = values.reduce((a, b) => a + b, 0);
      averages.set(status, sum / values.length);
    } else {
      averages.set(status, 0);
    }
  }

  return averages;
}

function calculateMedians(issues: IssueTimeInStatus[], statuses: string[]): Map<string, number> {
  const medians = new Map<string, number>();

  for (const status of statuses) {
    const values: number[] = [];
    for (const issue of issues) {
      const duration = issue.statusDurations.get(status);
      if (duration !== undefined && duration > 0) {
        values.push(duration);
      }
    }

    if (values.length > 0) {
      values.sort((a, b) => a - b);
      const mid = Math.floor(values.length / 2);
      const median = values.length % 2 !== 0 ? values[mid] : (values[mid - 1] + values[mid]) / 2;
      medians.set(status, median);
    } else {
      medians.set(status, 0);
    }
  }

  return medians;
}

// Formatting utilities
export function formatDurationHMS(ms: number): string {
  if (ms <= 0) return '';

  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

export function formatDurationDays(ms: number): string {
  if (ms <= 0) return '';

  const days = ms / (1000 * 60 * 60 * 24);
  return days.toFixed(2);
}

export function generateCSV(report: TimeInStatusReport): string {
  const lines: string[] = [];

  // Header row
  const header = ['TICKET ID', ...report.allStatuses].join(',');
  lines.push(header);

  // Issue rows
  for (const issue of report.issues) {
    const row = [issue.issueKey];
    for (const status of report.allStatuses) {
      const duration = issue.statusDurations.get(status) || 0;
      row.push(formatDurationHMS(duration));
    }
    lines.push(row.join(','));
  }

  // Empty row
  lines.push(report.allStatuses.map(() => '').join(','));

  // Total hours row
  const totalHoursRow = ['"Total, h"'];
  for (const status of report.allStatuses) {
    totalHoursRow.push(formatDurationHMS(report.totals.get(status) || 0));
  }
  lines.push(totalHoursRow.join(','));

  // Total days row
  const totalDaysRow = ['"Total, d"'];
  for (const status of report.allStatuses) {
    totalDaysRow.push(formatDurationDays(report.totals.get(status) || 0));
  }
  lines.push(totalDaysRow.join(','));

  // Average hours row
  const avgHoursRow = ['"Average, h"'];
  for (const status of report.allStatuses) {
    avgHoursRow.push(formatDurationHMS(report.averages.get(status) || 0));
  }
  lines.push(avgHoursRow.join(','));

  // Average days row
  const avgDaysRow = ['"Average, d"'];
  for (const status of report.allStatuses) {
    avgDaysRow.push(formatDurationDays(report.averages.get(status) || 0));
  }
  lines.push(avgDaysRow.join(','));

  // Median hours row
  const medianHoursRow = ['"Median, h"'];
  for (const status of report.allStatuses) {
    medianHoursRow.push(formatDurationHMS(report.medians.get(status) || 0));
  }
  lines.push(medianHoursRow.join(','));

  // Median days row
  const medianDaysRow = ['"Median, d"'];
  for (const status of report.allStatuses) {
    medianDaysRow.push(formatDurationDays(report.medians.get(status) || 0));
  }
  lines.push(medianDaysRow.join(','));

  return lines.join('\n');
}
