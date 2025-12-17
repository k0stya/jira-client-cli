import * as readline from 'readline';
import chalk from 'chalk';
import type { Command } from 'commander';
import { getActiveProfile, getActiveProfileName } from './services/config.js';

export async function startRepl(_program: Command): Promise<void> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  printWelcome();

  // If no active profile and running interactively, prompt to create one
  const profile = getActiveProfile();
  if (!profile && process.stdin.isTTY) {
    console.log(chalk.yellow('Let\'s create your first profile:\n'));
    try {
      const freshProgram = await createFreshProgram();
      await freshProgram.parseAsync(['node', 'jira-cli', 'profile', 'create'], { from: 'node' });
    } catch (err) {
      // Ignore commander exit errors
    }
    console.log('');
  }

  promptNext(rl);

  // Handle Ctrl+C gracefully
  rl.on('close', () => {
    console.log(chalk.gray('\nGoodbye!'));
    process.exit(0);
  });
}

function printWelcome(): void {
  console.log(chalk.cyan.bold('\n  JIRA CLI - Interactive Mode'));
  console.log(chalk.gray('  Type "help" for available commands, "exit" to quit.\n'));

  const profile = getActiveProfile();
  if (profile) {
    console.log(chalk.green(`  Active profile: ${profile.name} (${profile.domain})\n`));
  }
}

async function createFreshProgram(): Promise<Command> {
  const { createProgram } = await import('./cli.js');
  return createProgram();
}

async function handleInput(input: string, rl: readline.Interface): Promise<void> {
  if (!input) {
    promptNext(rl);
    return;
  }

  const args = parseArgs(input);
  const command = args[0]?.toLowerCase();

  // Handle built-in REPL commands
  switch (command) {
    case 'exit':
    case 'quit':
    case 'q':
      console.log(chalk.gray('Goodbye!'));
      rl.close();
      process.exit(0);
      return;

    case 'clear':
    case 'cls':
      console.clear();
      promptNext(rl);
      return;

    case 'help':
    case '?':
      if (args.length === 1) {
        printHelp();
        promptNext(rl);
        return;
      }
      break;
  }

  // Execute command using Commander
  try {
    const program = await createFreshProgram();
    await program.parseAsync(['node', 'jira-cli', ...args], { from: 'node' });
  } catch (err) {
    // Commander throws on unknown commands, we handle it gracefully
    if (err instanceof Error) {
      const message = err.message;
      // Ignore commander exit codes for help/version
      if (!message.includes('process.exit') && !message.includes('commander.')) {
        console.error(chalk.red(`Error: ${message}`));
      }
    }
  }

  promptNext(rl);
}

function promptNext(rl: readline.Interface): void {
  const profileName = getActiveProfileName();
  const promptText = profileName
    ? chalk.cyan(`jira-cli [${profileName}]> `)
    : chalk.cyan('jira-cli> ');
  rl.question(promptText, async (input) => {
    await handleInput(input.trim(), rl);
  });
}

function parseArgs(input: string): string[] {
  const args: string[] = [];
  let current = '';
  let inQuotes = false;
  let quoteChar = '';

  for (let i = 0; i < input.length; i++) {
    const char = input[i];

    if ((char === '"' || char === "'") && !inQuotes) {
      inQuotes = true;
      quoteChar = char;
    } else if (char === quoteChar && inQuotes) {
      inQuotes = false;
      quoteChar = '';
    } else if (char === ' ' && !inQuotes) {
      if (current) {
        args.push(current);
        current = '';
      }
    } else {
      current += char;
    }
  }

  if (current) {
    args.push(current);
  }

  return args;
}

function printHelp(): void {
  console.log(`
${chalk.cyan.bold('Available Commands:')}

${chalk.yellow('Profile Management:')}
  profile create              Create a new JIRA profile
  profile list                List all profiles
  profile use <name>          Switch to a different profile
  profile show [name]         Show profile details
  profile delete <name>       Delete a profile

${chalk.yellow('Issue Commands:')}
  issue get <key>             Get issue details
  issue time-in-status <jql>  Calculate time in status (CSV output)

${chalk.yellow('Session Commands:')}
  help, ?                     Show this help
  clear, cls                  Clear the screen
  exit, quit, q               Exit the CLI

${chalk.gray('Examples:')}
  profile create
  issue get PROJ-123
  issue time-in-status "project = PROJ" --output report.csv
`);
}
