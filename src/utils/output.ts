import chalk from 'chalk';
import Table from 'cli-table3';
import type { JiraIssue } from '../types/jira.js';
import type { Profile } from '../types/config.js';
import { maskToken } from '../services/config.js';

export function formatIssueDetail(issue: JiraIssue): string {
  const fields = issue.fields;
  const lines: string[] = [];

  const headerLine = `${chalk.cyan.bold(issue.key)}: ${fields.summary}`;
  const separator = '─'.repeat(60);

  lines.push(separator);
  lines.push(headerLine);
  lines.push(separator);
  lines.push(`${chalk.gray('Type:')}       ${fields.issuetype.name}`);
  lines.push(`${chalk.gray('Status:')}     ${formatStatus(fields.status.name)}`);
  lines.push(`${chalk.gray('Priority:')}   ${fields.priority?.name || 'None'}`);
  lines.push(`${chalk.gray('Project:')}    ${fields.project.name} (${fields.project.key})`);
  lines.push(`${chalk.gray('Assignee:')}   ${fields.assignee?.displayName || 'Unassigned'}`);
  lines.push(`${chalk.gray('Reporter:')}   ${fields.reporter?.displayName || 'Unknown'}`);
  lines.push(`${chalk.gray('Created:')}    ${formatDate(fields.created)}`);
  lines.push(`${chalk.gray('Updated:')}    ${formatDate(fields.updated)}`);

  if (fields.labels?.length > 0) {
    lines.push(`${chalk.gray('Labels:')}     ${fields.labels.join(', ')}`);
  }

  if (fields.components?.length > 0) {
    lines.push(`${chalk.gray('Components:')} ${fields.components.map((c) => c.name).join(', ')}`);
  }

  lines.push(separator);

  if (fields.description) {
    lines.push(chalk.gray('Description:'));
    lines.push(formatDescription(fields.description));
  }

  return lines.join('\n');
}

function formatStatus(status: string): string {
  const lowerStatus = status.toLowerCase();
  if (lowerStatus.includes('done') || lowerStatus.includes('closed') || lowerStatus.includes('resolved')) {
    return chalk.green(status);
  }
  if (lowerStatus.includes('progress') || lowerStatus.includes('review')) {
    return chalk.yellow(status);
  }
  if (lowerStatus.includes('blocked')) {
    return chalk.red(status);
  }
  return chalk.blue(status);
}

function formatDate(isoDate: string): string {
  const date = new Date(isoDate);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatDescription(description: unknown): string {
  if (!description) {
    return chalk.gray('No description');
  }

  // JIRA uses Atlassian Document Format (ADF) for descriptions
  // We'll extract plain text from it
  if (typeof description === 'object' && description !== null) {
    return extractTextFromADF(description);
  }

  if (typeof description === 'string') {
    return description;
  }

  return chalk.gray('No description');
}

function extractTextFromADF(node: unknown): string {
  if (!node || typeof node !== 'object') {
    return '';
  }

  const adfNode = node as { type?: string; text?: string; content?: unknown[] };

  if (adfNode.type === 'text' && adfNode.text) {
    return adfNode.text;
  }

  if (Array.isArray(adfNode.content)) {
    return adfNode.content.map((child) => extractTextFromADF(child)).join('');
  }

  return '';
}

export function formatProfilesTable(profiles: Record<string, Profile>, activeProfileName: string): string {
  const table = new Table({
    head: [chalk.cyan(''), chalk.cyan('Name'), chalk.cyan('Domain'), chalk.cyan('Email')],
    style: { head: [], border: [] },
  });

  const sortedNames = Object.keys(profiles).sort();

  for (const name of sortedNames) {
    const profile = profiles[name];
    const isActive = name === activeProfileName;
    table.push([isActive ? chalk.green('*') : '', profile.name, profile.domain, profile.email]);
  }

  if (sortedNames.length === 0) {
    return chalk.yellow('No profiles configured. Run "jira-cli profile create" to create one.');
  }

  return table.toString();
}

export function formatProfileDetail(profile: Profile, isActive: boolean): string {
  const lines: string[] = [];

  lines.push(chalk.cyan.bold(`Profile: ${profile.name}`) + (isActive ? chalk.green(' (active)') : ''));
  lines.push(`${chalk.gray('Domain:')}  ${profile.domain}`);
  lines.push(`${chalk.gray('Email:')}   ${profile.email}`);
  lines.push(`${chalk.gray('Token:')}   ${maskToken(profile.token)}`);
  lines.push(`${chalk.gray('Created:')} ${formatDate(profile.createdAt)}`);

  return lines.join('\n');
}

export function success(message: string): void {
  console.log(chalk.green('✓'), message);
}

export function error(message: string): void {
  console.error(chalk.red('✗'), message);
}

export function warn(message: string): void {
  console.log(chalk.yellow('!'), message);
}

export function info(message: string): void {
  console.log(chalk.blue('ℹ'), message);
}
