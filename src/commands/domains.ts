import { Command } from '@commander-js/extra-typings';
import type { CreateDomainRequest, UpdateDomainRequest } from '@nuntly/sdk';
import { confirmAction, createNuntlyClient } from '../auth.js';
import { resolveBody } from '../files.js';
import { parseFormat, printError, printResult } from '../output.js';
import { withSpinner } from '../spinner.js';

export const domainsCommand = new Command('domains').description('Domains resource.');

domainsCommand
  .command('create')
  .description(
    'Adds a domain for sending, receiving, or both, and returns the DNS records to publish. Verification starts automatically and the plan domain limit applies.',
  )
  .option('--name <value>', "The name of the domain to send e-mails' (required)")
  .option('--sending', 'Enable sending')
  .option('--no-sending', 'Send false for --sending')
  .option('--receiving', 'Enable receiving')
  .option('--no-receiving', 'Send false for --receiving')
  .option('--file <path>', 'Read JSON body from file (use - for stdin)')
  .option('--format <fmt>', 'Output format: json, raw, yaml, csv, markdown, table, quiet', parseFormat)
  .option('-q, --quiet', 'Shorthand for --format quiet')
  .option('--raw', 'Shorthand for --format raw')
  .option('--fields <fields>', 'Comma-separated list of fields to display')
  .option('--no-header', 'Omit column headers in table/csv output')
  .addHelpText(
    'after',
    '\nExample:\n  $ nuntly domains create --name example.com\n  $ cat payload.json | nuntly domains create --file -\n  $ nuntly domains create --file payload.json',
  )
  .action(async (opts, cmd) => {
    try {
      const { nuntly } = createNuntlyClient(cmd);
      const body = resolveBody(opts.file, {
        name: opts.name,
        sending: opts.sending,
        receiving: opts.receiving,
      });
      const result = await withSpinner('Creating...', () => nuntly.domains.create(body as CreateDomainRequest));
      printResult(result, opts);
    } catch (error) {
      printError(error, opts);
    }
  });

domainsCommand
  .command('delete')
  .description(
    'Permanently deletes a domain along with its inboxes, received messages, attachments, and sending configuration. This action is irreversible.',
  )
  .argument('<id>', 'The id')
  .option('--format <fmt>', 'Output format: json, raw, yaml, csv, markdown, table, quiet', parseFormat)
  .option('-q, --quiet', 'Shorthand for --format quiet')
  .option('--raw', 'Shorthand for --format raw')
  .option('--fields <fields>', 'Comma-separated list of fields to display')
  .option('--no-header', 'Omit column headers in table/csv output')
  .addHelpText('after', '\nExample:\n  $ nuntly domains delete dns_01kabn43yqyxn2bx4ve84mczd3')
  .action(async (id, opts, cmd) => {
    try {
      const { nuntly, globals } = createNuntlyClient(cmd);
      if (!(await confirmAction('delete', 'domain', id, !!globals.yes))) return;
      const result = await withSpinner('Deleting...', () => nuntly.domains.delete(id));
      printResult(result, opts);
    } catch (error) {
      printError(error, opts);
    }
  });

domainsCommand
  .command('list')
  .description(
    'Lists the domains of your organization, newest first, with cursor pagination. Each domain shows its verification status and sending and receiving status.',
  )
  .option('--cursor <cursor>', 'Pagination cursor')
  .option('--limit <limit>', 'The maximum number of results to return, from 1 to 30. Defaults to 30.')
  .option('--all', 'Fetch all pages (auto-paginate)')
  .option('--format <fmt>', 'Output format: json, raw, yaml, csv, markdown, table, quiet', parseFormat)
  .option('-q, --quiet', 'Shorthand for --format quiet')
  .option('--raw', 'Shorthand for --format raw')
  .option('--fields <fields>', 'Comma-separated list of fields to display')
  .option('--no-header', 'Omit column headers in table/csv output')
  .addHelpText('after', "\nExample:\n  $ nuntly domains list\n  $ nuntly domains list --format json | jq '.data[].id'")
  .action(async (opts, cmd) => {
    try {
      const { nuntly } = createNuntlyClient(cmd);
      if (opts.all) {
        const page = await withSpinner('Loading...', () =>
          nuntly.domains.list({ cursor: opts.cursor, limit: opts.limit ? Number(opts.limit) : undefined }),
        );
        const all = [] as typeof page.data;
        for await (const item of page) all.push(item);
        printResult({ data: all, nextCursor: null }, opts);
      } else {
        const page = await withSpinner('Loading...', () =>
          nuntly.domains.list({ cursor: opts.cursor, limit: opts.limit ? Number(opts.limit) : undefined }),
        );
        printResult({ data: page.data, nextCursor: page.nextCursor }, opts);
      }
    } catch (error) {
      printError(error, opts);
    }
  });

domainsCommand
  .command('retrieve')
  .description(
    'Retrieves a domain with its capabilities, tracking settings, statuses, and the DNS records to publish, each with its own verification status.',
  )
  .argument('<id>', 'The id')
  .option('--format <fmt>', 'Output format: json, raw, yaml, csv, markdown, table, quiet', parseFormat)
  .option('-q, --quiet', 'Shorthand for --format quiet')
  .option('--raw', 'Shorthand for --format raw')
  .option('--fields <fields>', 'Comma-separated list of fields to display')
  .option('--no-header', 'Omit column headers in table/csv output')
  .addHelpText('after', '\nExample:\n  $ nuntly domains retrieve dns_01kabn43yqyxn2bx4ve84mczd3')
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
  .description(
    'Turns sending, receiving, open tracking, or click tracking on or off for a domain. Enabling a capability adds its DNS records and restarts verification.',
  )
  .argument('<id>', 'The id')
  .option('--open-tracking', 'Emit an event for each recipient opens an email their email client')
  .option('--no-open-tracking', 'Send false for --open-tracking')
  .option('--click-tracking', 'Emit an event for each time the recipient clicks a link in the email')
  .option('--no-click-tracking', 'Send false for --click-tracking')
  .option('--sending', 'Enable or disable sending')
  .option('--no-sending', 'Send false for --sending')
  .option('--receiving', 'Enable or disable receiving')
  .option('--no-receiving', 'Send false for --receiving')
  .option('--file <path>', 'Read JSON body from file (use - for stdin)')
  .option('--format <fmt>', 'Output format: json, raw, yaml, csv, markdown, table, quiet', parseFormat)
  .option('-q, --quiet', 'Shorthand for --format quiet')
  .option('--raw', 'Shorthand for --format raw')
  .option('--fields <fields>', 'Comma-separated list of fields to display')
  .option('--no-header', 'Omit column headers in table/csv output')
  .addHelpText(
    'after',
    '\nExample:\n  $ nuntly domains update dns_01kabn43yqyxn2bx4ve84mczd3 --open-tracking --click-tracking\n  $ cat payload.json | nuntly domains update dns_01kabn43yqyxn2bx4ve84mczd3 --file -\n  $ nuntly domains update dns_01kabn43yqyxn2bx4ve84mczd3 --file payload.json',
  )
  .action(async (id, opts, cmd) => {
    try {
      const { nuntly } = createNuntlyClient(cmd);
      const body = resolveBody(opts.file, {
        openTracking: opts.openTracking,
        clickTracking: opts.clickTracking,
        sending: opts.sending,
        receiving: opts.receiving,
      });
      const result = await withSpinner('Updating...', () => nuntly.domains.update(id, body as UpdateDomainRequest));
      printResult(result, opts);
    } catch (error) {
      printError(error, opts);
    }
  });
