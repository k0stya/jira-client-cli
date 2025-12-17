import { Command } from 'commander';
import { getAllProfiles, getActiveProfileName } from '../../services/config.js';
import { formatProfilesTable } from '../../utils/output.js';

export function registerListCommand(parent: Command): void {
  parent
    .command('list')
    .description('List all JIRA profiles')
    .action(() => {
      const profiles = getAllProfiles();
      const activeProfileName = getActiveProfileName();
      console.log(formatProfilesTable(profiles, activeProfileName));
    });
}
