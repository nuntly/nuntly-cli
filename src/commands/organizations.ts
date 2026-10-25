import { Command } from '@commander-js/extra-typings';
import { confirmAction, createNuntlyClient } from '../auth.js';
import { parseFormat, printError, printResult } from '../output.js';
import { withSpinner } from '../spinner.js';

export const organizationsCommand = new Command('organizations').description('Organizations resource.');

const usageSub = new Command('usage');
organizationsCommand.addCommand(usageSub);

usageSub
  .command('retrieve')
  .description(
    'Returns the daily and monthly email usage of the organization, with each limit, its reset time, and a breakdown by channel.',
  )
  .argument('<id>', 'The id')
  .option('--format <fmt>', 'Output format: json, raw, yaml, csv, markdown, table, quiet', parseFormat)
  .option('-q, --quiet', 'Shorthand for --format quiet')
  .option('--raw', 'Shorthand for --format raw')
  .option('--fields <fields>', 'Comma-separated list of fields to display')
  .option('--no-header', 'Omit column headers in table/csv output')
  .addHelpText('after', '\nExample:\n  $ nuntly organizations usage retrieve org_01ka8k8s80gvx9604cn9am5st4')
  .action(async (id, opts, cmd) => {
    try {
      const { nuntly } = createNuntlyClient(cmd);
      const result = await withSpinner('Loading...', () => nuntly.organizations.usage.retrieve(id));
      printResult(result, opts);
    } catch (error) {
      printError(error, opts);
    }
  });

organizationsCommand
  .command('list')
  .description(
    'Lists the organization that the API key belongs to, with its id, name, and status. The result is paginated with a cursor like other list endpoints.',
  )
  .option('--cursor <cursor>', 'Pagination cursor')
  .option('--limit <limit>', 'The maximum number of results to return, from 1 to 30. Defaults to 30.')
  .option('--all', 'Fetch all pages (auto-paginate)')
  .option('--format <fmt>', 'Output format: json, raw, yaml, csv, markdown, table, quiet', parseFormat)
  .option('-q, --quiet', 'Shorthand for --format quiet')
  .option('--raw', 'Shorthand for --format raw')
  .option('--fields <fields>', 'Comma-separated list of fields to display')
  .option('--no-header', 'Omit column headers in table/csv output')
  .addHelpText(
    'after',
    "\nExample:\n  $ nuntly organizations list\n  $ nuntly organizations list --format json | jq '.data[].id'",
  )
  .action(async (opts, cmd) => {
    try {
      const { nuntly } = createNuntlyClient(cmd);
      if (opts.all) {
        const page = await withSpinner('Loading...', () =>
          nuntly.organizations.list({ cursor: opts.cursor, limit: opts.limit ? Number(opts.limit) : undefined }),
        );
        const all = [] as typeof page.data;
        for await (const item of page) all.push(item);
        printResult({ data: all, nextCursor: null }, opts);
      } else {
        const page = await withSpinner('Loading...', () =>
          nuntly.organizations.list({ cursor: opts.cursor, limit: opts.limit ? Number(opts.limit) : undefined }),
        );
        printResult({ data: page.data, nextCursor: page.nextCursor }, opts);
      }
    } catch (error) {
      printError(error, opts);
    }
  });

organizationsCommand
  .command('retrieve')
  .description(
    'Retrieves the organization that the API key belongs to by id, returning its name and its status (enabled or disabled).',
  )
  .argument('<id>', 'The id')
  .option('--format <fmt>', 'Output format: json, raw, yaml, csv, markdown, table, quiet', parseFormat)
  .option('-q, --quiet', 'Shorthand for --format quiet')
  .option('--raw', 'Shorthand for --format raw')
  .option('--fields <fields>', 'Comma-separated list of fields to display')
  .option('--no-header', 'Omit column headers in table/csv output')
  .addHelpText('after', '\nExample:\n  $ nuntly organizations retrieve org_01ka8k8s80gvx9604cn9am5st4')
  .action(async (id, opts, cmd) => {
    try {
      const { nuntly } = createNuntlyClient(cmd);
      const result = await withSpinner('Loading...', () => nuntly.organizations.retrieve(id));
      printResult(result, opts);
    } catch (error) {
      printError(error, opts);
    }
  });
