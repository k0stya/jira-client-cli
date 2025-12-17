import { Command } from 'commander';
import { registerCreateCommand } from './create.js';
import { registerListCommand } from './list.js';
import { registerUseCommand } from './use.js';
import { registerDeleteCommand } from './delete.js';
import { registerShowCommand } from './show.js';

export function registerProfileCommands(program: Command): void {
  const profileCommand = program.command('profile').description('Manage JIRA profiles');

  registerCreateCommand(profileCommand);
  registerListCommand(profileCommand);
  registerUseCommand(profileCommand);
  registerDeleteCommand(profileCommand);
  registerShowCommand(profileCommand);
}
