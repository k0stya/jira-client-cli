import { Command } from 'commander';
import { registerGetCommand } from './get.js';

export function registerIssueCommands(program: Command): void {
  const issueCommand = program.command('issue').description('Work with JIRA issues');

  registerGetCommand(issueCommand);
}
