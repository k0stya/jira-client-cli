import { Command } from 'commander';
import { registerGetCommand } from './get.js';
import { registerTimeInStatusCommand } from './time-in-status.js';

export function registerIssueCommands(program: Command): void {
  const issueCommand = program.command('issue').description('Work with JIRA issues');

  registerGetCommand(issueCommand);
  registerTimeInStatusCommand(issueCommand);
}
