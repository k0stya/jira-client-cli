import { Command } from 'commander';
import chalk from 'chalk';
import { registerProfileCommands } from './commands/profile/index.js';
import { registerIssueCommands } from './commands/issue/index.js';
import { JiraCliError } from './utils/errors.js';

const program = new Command();

program
  .name('jira-cli')
  .description('A cross-platform CLI client for JIRA')
  .version('0.1.0');

// Register command groups
registerProfileCommands(program);
registerIssueCommands(program);

// Global error handling
process.on('uncaughtException', (err) => {
  if (err instanceof JiraCliError) {
    console.error(chalk.red(`Error: ${err.message}`));
    process.exit(1);
  }
  console.error(chalk.red('An unexpected error occurred:'));
  console.error(err.message);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  if (reason instanceof JiraCliError) {
    console.error(chalk.red(`Error: ${reason.message}`));
    process.exit(1);
  }
  console.error(chalk.red('An unexpected error occurred:'));
  console.error(reason);
  process.exit(1);
});

program.parse();
