import { Command } from 'commander';
import { setActiveProfile, profileExists } from '../../services/config.js';
import { success, error } from '../../utils/output.js';

export function registerUseCommand(parent: Command): void {
  parent
    .command('use <name>')
    .description('Switch to a different profile')
    .action((name: string) => {
      if (!profileExists(name)) {
        error(`Profile "${name}" does not exist. Run "jira-cli profile list" to see available profiles.`);
        process.exit(1);
      }

      setActiveProfile(name);
      success(`Switched to profile "${name}".`);
    });
}
