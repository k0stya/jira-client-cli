import { Command } from 'commander';
import inquirer from 'inquirer';
import ora from 'ora';
import chalk from 'chalk';
import { createProfile, profileExists } from '../../services/config.js';
import { JiraApiClient } from '../../services/jira-api.js';
import type { Profile } from '../../types/config.js';
import { success, error } from '../../utils/output.js';

interface CreateOptions {
  name?: string;
  domain?: string;
  email?: string;
  token?: string;
}

export function registerCreateCommand(parent: Command): void {
  parent
    .command('create')
    .description('Create a new JIRA profile')
    .option('-n, --name <name>', 'Profile name')
    .option('-d, --domain <domain>', 'JIRA domain (e.g., company.atlassian.net)')
    .option('-e, --email <email>', 'Email address')
    .option('-t, --token <token>', 'API token')
    .action(async (options: CreateOptions) => {
      try {
        // Collect missing information interactively
        const answers = await promptForMissingInfo(options);

        // Validate that profile name doesn't already exist
        if (profileExists(answers.name)) {
          error(`Profile "${answers.name}" already exists. Use a different name or delete the existing profile.`);
          process.exit(1);
        }

        // Validate credentials
        const spinner = ora('Validating credentials...').start();

        const testProfile: Profile = {
          name: answers.name,
          domain: answers.domain,
          email: answers.email,
          token: answers.token,
          createdAt: new Date().toISOString(),
        };

        try {
          const client = new JiraApiClient(testProfile);
          const user = await client.validateConnection();
          spinner.succeed(`Authenticated as ${chalk.cyan(user.displayName)}`);
        } catch (err) {
          spinner.fail('Failed to validate credentials');
          if (err instanceof Error) {
            error(err.message);
          }
          process.exit(1);
        }

        // Save the profile
        createProfile(testProfile);
        success(`Profile "${answers.name}" created and set as active.`);
      } catch (err) {
        if (err instanceof Error) {
          error(err.message);
        }
        process.exit(1);
      }
    });
}

interface Question {
  type: string;
  name: string;
  message: string;
  mask?: string;
  validate?: (input: string) => boolean | string;
}

async function promptForMissingInfo(options: CreateOptions): Promise<{
  name: string;
  domain: string;
  email: string;
  token: string;
}> {
  const questions: Question[] = [];

  if (!options.name) {
    questions.push({
      type: 'input',
      name: 'name',
      message: 'Profile name:',
      validate: (input: string) => {
        if (!input.trim()) {
          return 'Profile name is required';
        }
        if (!/^[a-zA-Z0-9_-]+$/.test(input)) {
          return 'Profile name can only contain letters, numbers, underscores, and hyphens';
        }
        return true;
      },
    });
  }

  if (!options.domain) {
    questions.push({
      type: 'input',
      name: 'domain',
      message: 'JIRA domain (e.g., company.atlassian.net):',
      validate: (input: string) => {
        if (!input.trim()) {
          return 'JIRA domain is required';
        }
        if (!input.includes('.')) {
          return 'Please enter a valid domain (e.g., company.atlassian.net)';
        }
        return true;
      },
    });
  }

  if (!options.email) {
    questions.push({
      type: 'input',
      name: 'email',
      message: 'Email address:',
      validate: (input: string) => {
        if (!input.trim()) {
          return 'Email is required';
        }
        if (!input.includes('@')) {
          return 'Please enter a valid email address';
        }
        return true;
      },
    });
  }

  if (!options.token) {
    questions.push({
      type: 'password',
      name: 'token',
      message: 'API token:',
      mask: '*',
      validate: (input: string) => {
        if (!input.trim()) {
          return 'API token is required';
        }
        return true;
      },
    });
  }

  const answers: Record<string, string> = questions.length > 0 ? await inquirer.prompt(questions) : {};

  return {
    name: options.name || answers.name,
    domain: (options.domain || answers.domain).replace(/^https?:\/\//, '').replace(/\/$/, ''),
    email: options.email || answers.email,
    token: options.token || answers.token,
  };
}
