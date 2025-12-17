import { Command } from 'commander';
import ora from 'ora';
import fs from 'fs';
import { getActiveProfile } from '../../services/config.js';
import { JiraApiClient } from '../../services/jira-api.js';
import { calculateTimeInStatus, generateCSV } from '../../services/time-in-status.js';
import { error, success, info } from '../../utils/output.js';
import { NoProfileError } from '../../utils/errors.js';
import type { JiraIssueWithChangelog } from '../../types/jira.js';

interface TimeInStatusOptions {
  output?: string;
  maxResults?: string;
}

export function registerTimeInStatusCommand(parent: Command): void {
  parent
    .command('time-in-status <jql>')
    .description('Calculate time spent in each status for issues matching JQL query')
    .option('-o, --output <file>', 'Output CSV file path (defaults to stdout)')
    .option('-m, --max-results <number>', 'Maximum number of issues to fetch (default: 100)', '100')
    .action(async (jql: string, options: TimeInStatusOptions) => {
      const profile = getActiveProfile();
      if (!profile) {
        throw new NoProfileError();
      }

      const maxResults = parseInt(options.maxResults || '100', 10);
      const client = new JiraApiClient(profile);

      // Fetch all issues with changelog
      const spinner = ora('Fetching issues...').start();
      const allIssues: JiraIssueWithChangelog[] = [];

      try {
        let startAt = 0;
        let total = 0;

        do {
          const batchSize = Math.min(50, maxResults - allIssues.length);
          spinner.text = `Fetching issues... (${allIssues.length}/${total || '?'})`;

          const result = await client.searchIssuesWithChangelog(jql, batchSize, startAt);
          total = result.total;
          allIssues.push(...result.issues);
          startAt += batchSize;
        } while (allIssues.length < total && allIssues.length < maxResults);

        spinner.succeed(`Fetched ${allIssues.length} issues`);
      } catch (err) {
        spinner.fail('Failed to fetch issues');
        if (err instanceof Error) {
          error(err.message);
        }
        process.exit(1);
      }

      if (allIssues.length === 0) {
        info('No issues found matching the JQL query.');
        return;
      }

      // Calculate time in status
      const calcSpinner = ora('Calculating time in status...').start();
      const report = calculateTimeInStatus(allIssues);
      calcSpinner.succeed('Calculated time in status');

      // Generate CSV
      const csv = generateCSV(report);

      if (options.output) {
        // Write to file
        try {
          fs.writeFileSync(options.output, csv, 'utf-8');
          success(`Report saved to ${options.output}`);
        } catch (err) {
          error(`Failed to write file: ${err instanceof Error ? err.message : 'Unknown error'}`);
          process.exit(1);
        }
      } else {
        // Output to stdout
        console.log('\n' + csv);
      }

      // Print summary
      info(`\nSummary: ${report.issues.length} issues, ${report.allStatuses.length} statuses`);
    });
}
