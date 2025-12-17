import { Command } from 'commander';
import { getProfile, getActiveProfile, getActiveProfileName } from '../../services/config.js';
import { formatProfileDetail, error } from '../../utils/output.js';

export function registerShowCommand(parent: Command): void {
  parent
    .command('show [name]')
    .description('Show profile details (defaults to active profile)')
    .action((name?: string) => {
      const activeProfileName = getActiveProfileName();

      if (name) {
        const profile = getProfile(name);
        if (!profile) {
          error(`Profile "${name}" does not exist.`);
          process.exit(1);
        }
        console.log(formatProfileDetail(profile, name === activeProfileName));
      } else {
        const profile = getActiveProfile();
        if (!profile) {
          error('No active profile configured. Run "jira-cli profile create" to create one.');
          process.exit(1);
        }
        console.log(formatProfileDetail(profile, true));
      }
    });
}
