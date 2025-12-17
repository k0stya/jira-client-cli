import { Command } from 'commander';
import chalk from 'chalk';
import { registerProfileCommands } from './commands/profile/index.js';
import { registerIssueCommands } from './commands/issue/index.js';
import { JiraCliError } from './utils/errors.js';
import { startRepl } from './repl.js';

export function createProgram(): Command {
  const program = new Command();

  program
    .name('jira-cli')
    .description('A cross-platform CLI client for JIRA')
    .version('0.1.0')
    .exitOverride(); // Don't exit on errors in REPL mode

  // Register command groups
  registerProfileCommands(program);
  registerIssueCommands(program);

  return program;
}

function setupErrorHandlers(): void {
  process.on('uncaughtException', (err) => {
    if (err instanceof JiraCliError) {
      console.error(chalk.red(`Error: ${err.message}`));
      return;
    }
    // Don't exit for commander errors in REPL mode
    if (err.message?.includes('commander')) {
      return;
    }
    console.error(chalk.red('An unexpected error occurred:'));
    console.error(err.message);
  });

  process.on('unhandledRejection', (reason) => {
    if (reason instanceof JiraCliError) {
      console.error(chalk.red(`Error: ${reason.message}`));
      return;
    }
    console.error(chalk.red('An unexpected error occurred:'));
    console.error(reason);
  });
}

async function main(): Promise<void> {
  setupErrorHandlers();

  const args = process.argv.slice(2);

  // If no arguments provided, start interactive REPL mode
  if (args.length === 0) {
    const program = createProgram();
    await startRepl(program);
  } else {
    // One-shot command mode
    const program = createProgram();
    program.exitOverride((err) => {
      // Allow normal exit for help and version
      if (err.code === 'commander.helpDisplayed' || err.code === 'commander.version') {
        process.exit(0);
      }
      throw err;
    });
    program.parse();
  }
}

main();
