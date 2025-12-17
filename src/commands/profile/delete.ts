import { Command } from 'commander';
import inquirer from 'inquirer';
import { deleteProfile, profileExists, getActiveProfileName } from '../../services/config.js';
import { success, error, warn } from '../../utils/output.js';

interface DeleteOptions {
  force?: boolean;
}

export function registerDeleteCommand(parent: Command): void {
  parent
    .command('delete <name>')
    .description('Delete a profile')
    .option('-f, --force', 'Skip confirmation prompt')
    .action(async (name: string, options: DeleteOptions) => {
      if (!profileExists(name)) {
        error(`Profile "${name}" does not exist.`);
        process.exit(1);
      }

      const isActive = getActiveProfileName() === name;

      if (!options.force) {
        const message = isActive
          ? `Are you sure you want to delete the active profile "${name}"?`
          : `Are you sure you want to delete profile "${name}"?`;

        const { confirm } = await inquirer.prompt([
          {
            type: 'confirm',
            name: 'confirm',
            message,
            default: false,
          },
        ]);

        if (!confirm) {
          console.log('Cancelled.');
          return;
        }
      }

      deleteProfile(name);
      success(`Profile "${name}" deleted.`);

      if (isActive) {
        warn('The active profile was deleted. Use "jira-cli profile use <name>" to set a new active profile.');
      }
    });
}
