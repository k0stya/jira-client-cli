import { Command } from 'commander';
import ora from 'ora';
import { getActiveProfile } from '../../services/config.js';
import { JiraApiClient } from '../../services/jira-api.js';
import { formatIssueDetail, error } from '../../utils/output.js';
import { NoProfileError } from '../../utils/errors.js';

interface GetOptions {
  json?: boolean;
}

export function registerGetCommand(parent: Command): void {
  parent
    .command('get <issue-key>')
    .description('Get details of a JIRA issue')
    .option('-j, --json', 'Output as JSON')
    .action(async (issueKey: string, options: GetOptions) => {
      const profile = getActiveProfile();
      if (!profile) {
        throw new NoProfileError();
      }

      const spinner = ora(`Fetching ${issueKey}...`).start();

      try {
        const client = new JiraApiClient(profile);
        const issue = await client.getIssue(issueKey);
        spinner.stop();

        if (options.json) {
          console.log(JSON.stringify(issue, null, 2));
        } else {
          console.log(formatIssueDetail(issue));
        }
      } catch (err) {
        spinner.fail(`Failed to fetch ${issueKey}`);
        if (err instanceof Error) {
          error(err.message);
        }
        process.exit(1);
      }
    });
}
