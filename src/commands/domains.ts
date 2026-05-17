import { Command } from '@commander-js/extra-typings';
import type { CreateDomainRequest, UpdateDomainRequest } from '@nuntly/sdk';
import { createNuntlyClient, confirmDelete } from '../auth.js';
import { printResult, printError } from '../output.js';
import { withSpinner } from '../spinner.js';
import { readInput } from '../files.js';

export const domainsCommand = new Command('domains')
  .description('Domains resource.');

domainsCommand
  .command('create')
  .description('Add a domain for sending or receiving emails.')
  .option('--name <value>', 'The name of the domain to send e-mails\' (required)')
  .option('--sending', 'Enable sending')
  .option('--receiving', 'Enable receiving')
  .option('--file <path>', 'Read JSON body from file (use - for stdin)')
  .option('--format <fmt>', 'Output format: json, raw, yaml, csv, markdown, table, quiet')
  .option('-q, --quiet', 'Shorthand for --format quiet')
  .option('--raw', 'Shorthand for --format raw')
  .option('--fields <fields>', 'Comma-separated list of fields to display')
  .option('--no-header', 'Omit column headers in table/csv output')
  .addHelpText('after', '\nExample:\n  $ nuntly domains create --name my-resource\n  $ cat payload.json | nuntly domains create\n  $ nuntly domains create --file payload.json')
  .action(async (opts, cmd) => {
    try {
      const { nuntly } = createNuntlyClient(cmd);
      const body = opts.file ? readInput(opts.file) : !process.stdin.isTTY ? readInput('-') : {
        name: opts.name,
        sending: opts.sending,
        receiving: opts.receiving
      };
      const result = await withSpinner('Creating...', () => nuntly.domains.create(body as CreateDomainRequest));
      printResult(result, opts);
    } catch (error) {
      printError(error, opts);
    }
  });

domainsCommand
  .command('delete')
  .description('Permanently deletes a domain along with its inboxes, received messages, attachments, and sending configuration. This action is irreversible.')
  .argument('<id>', 'The id')
  .option('--format <fmt>', 'Output format: json, raw, yaml, csv, markdown, table, quiet')
  .option('-q, --quiet', 'Shorthand for --format quiet')
  .option('--raw', 'Shorthand for --format raw')
  .option('--fields <fields>', 'Comma-separated list of fields to display')
  .option('--no-header', 'Omit column headers in table/csv output')
  .addHelpText('after', '\nExample:\n  $ nuntly domains delete dm_5678efgh')
  .action(async (id, opts, cmd) => {
    try {
      const { nuntly, globals } = createNuntlyClient(cmd);
      if (!await confirmDelete('domains', id, !!globals.yes)) return;
      const result = await withSpinner('Deleting...', () => nuntly.domains.delete(id));
      printResult(result, opts);
    } catch (error) {
      printError(error, opts);
    }
  });

domainsCommand
  .command('list')
  .description('Returns all domains with their verification and capability status.')
  .option('--cursor <cursor>', 'Pagination cursor')
  .option('--limit <limit>', 'Max items to return')
  .option('--all', 'Fetch all pages (auto-paginate)')
  .option('--format <fmt>', 'Output format: json, raw, yaml, csv, markdown, table, quiet')
  .option('-q, --quiet', 'Shorthand for --format quiet')
  .option('--raw', 'Shorthand for --format raw')
  .option('--fields <fields>', 'Comma-separated list of fields to display')
  .option('--no-header', 'Omit column headers in table/csv output')
  .addHelpText('after', '\nExample:\n  $ nuntly domains list\n  $ nuntly domains list --format json | jq \'.data[].id\'')
  .action(async (opts, cmd) => {
    try {
      const { nuntly } = createNuntlyClient(cmd);
      if (opts.all) {
        const page = await withSpinner('Loading...', () => nuntly.domains.list({ cursor: opts.cursor, limit: opts.limit ? Number(opts.limit) : undefined }));
        const all = [] as typeof page.data;
        for await (const item of page) all.push(item);
        printResult({ data: all }, opts);
      } else {
        const page = await withSpinner('Loading...', () => nuntly.domains.list({ cursor: opts.cursor, limit: opts.limit ? Number(opts.limit) : undefined }));
        printResult({ data: page.data, nextCursor: page.nextCursor }, opts);
      }
    } catch (error) {
      printError(error, opts);
    }
  });

domainsCommand
  .command('retrieve')
  .description('Returns a domain with its DNS record configuration and current verification status for each record.')
  .argument('<id>', 'The id')
  .option('--format <fmt>', 'Output format: json, raw, yaml, csv, markdown, table, quiet')
  .option('-q, --quiet', 'Shorthand for --format quiet')
  .option('--raw', 'Shorthand for --format raw')
  .option('--fields <fields>', 'Comma-separated list of fields to display')
  .option('--no-header', 'Omit column headers in table/csv output')
  .addHelpText('after', '\nExample:\n  $ nuntly domains retrieve dm_5678efgh')
  .action(async (id, opts, cmd) => {
    try {
      const { nuntly } = createNuntlyClient(cmd);
      const result = await withSpinner('Loading...', () => nuntly.domains.retrieve(id));
      printResult(result, opts);
    } catch (error) {
      printError(error, opts);
    }
  });

domainsCommand
  .command('update')
  .description('Toggle sending, receiving, open tracking, or click tracking capabilities for a domain.')
  .argument('<id>', 'The id')
  .option('--open-tracking', 'Emit an event for each recipient opens an email their email client')
  .option('--click-tracking', 'Emit an event for each time the recipient clicks a link in the email')
  .option('--sending', 'Enable or disable sending')
  .option('--receiving', 'Enable or disable receiving')
  .option('--file <path>', 'Read JSON body from file (use - for stdin)')
  .option('--format <fmt>', 'Output format: json, raw, yaml, csv, markdown, table, quiet')
  .option('-q, --quiet', 'Shorthand for --format quiet')
  .option('--raw', 'Shorthand for --format raw')
  .option('--fields <fields>', 'Comma-separated list of fields to display')
  .option('--no-header', 'Omit column headers in table/csv output')
  .addHelpText('after', '\nExample:\n  $ nuntly domains update dm_5678efgh --open-tracking\n  $ cat payload.json | nuntly domains update dm_5678efgh\n  $ nuntly domains update dm_5678efgh --file payload.json')
  .action(async (id, opts, cmd) => {
    try {
      const { nuntly } = createNuntlyClient(cmd);
      const body = opts.file ? readInput(opts.file) : !process.stdin.isTTY ? readInput('-') : {
        openTracking: opts.openTracking,
        clickTracking: opts.clickTracking,
        sending: opts.sending,
        receiving: opts.receiving
      };
      const result = await withSpinner('Updating...', () => nuntly.domains.update(id, body as UpdateDomainRequest));
      printResult(result, opts);
    } catch (error) {
      printError(error, opts);
    }
  });

