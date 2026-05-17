import { Command } from '@commander-js/extra-typings';
import type { CreateNamespaceRequest, UpdateNamespaceRequest } from '@nuntly/sdk';
import { createNuntlyClient, confirmDelete } from '../auth.js';
import { printResult, printError } from '../output.js';
import { withSpinner } from '../spinner.js';
import { readInput } from '../files.js';

export const namespacesCommand = new Command('namespaces')
  .description('Namespaces resource.');

const inboxesSub = new Command('inboxes');
namespacesCommand.addCommand(inboxesSub);

inboxesSub
  .command('list')
  .description('List inboxes in a namespace.')
  .argument('<namespace-id>', 'The namespaceId')
  .option('--cursor <cursor>', 'Pagination cursor')
  .option('--limit <limit>', 'Max items to return')
  .option('--all', 'Fetch all pages (auto-paginate)')
  .option('--format <fmt>', 'Output format: json, raw, yaml, csv, markdown, table, quiet')
  .option('-q, --quiet', 'Shorthand for --format quiet')
  .option('--raw', 'Shorthand for --format raw')
  .option('--fields <fields>', 'Comma-separated list of fields to display')
  .option('--no-header', 'Omit column headers in table/csv output')
  .addHelpText('after', '\nExample:\n  $ nuntly namespaces inboxes list ib_7890qrst\n  $ nuntly namespaces inboxes list ib_7890qrst --format json | jq \'.data[].id\'')
  .action(async (namespaceId, opts, cmd) => {
    try {
      const { nuntly } = createNuntlyClient(cmd);
      if (opts.all) {
        const page = await withSpinner('Loading...', () => nuntly.namespaces.inboxes.list(namespaceId, { cursor: opts.cursor, limit: opts.limit ? Number(opts.limit) : undefined }));
        const all = [] as typeof page.data;
        for await (const item of page) all.push(item);
        printResult({ data: all }, opts);
      } else {
        const page = await withSpinner('Loading...', () => nuntly.namespaces.inboxes.list(namespaceId, { cursor: opts.cursor, limit: opts.limit ? Number(opts.limit) : undefined }));
        printResult({ data: page.data, nextCursor: page.nextCursor }, opts);
      }
    } catch (error) {
      printError(error, opts);
    }
  });

namespacesCommand
  .command('create')
  .description('Create a new namespace.')
  .option('--name <value>', 'The display name of the namespace. (required)')
  .option('--external-id <value>', 'An optional external identifier for the namespace.')
  .option('--file <path>', 'Read JSON body from file (use - for stdin)')
  .option('--format <fmt>', 'Output format: json, raw, yaml, csv, markdown, table, quiet')
  .option('-q, --quiet', 'Shorthand for --format quiet')
  .option('--raw', 'Shorthand for --format raw')
  .option('--fields <fields>', 'Comma-separated list of fields to display')
  .option('--no-header', 'Omit column headers in table/csv output')
  .addHelpText('after', '\nExample:\n  $ nuntly namespaces create --name my-resource\n  $ cat payload.json | nuntly namespaces create\n  $ nuntly namespaces create --file payload.json')
  .action(async (opts, cmd) => {
    try {
      const { nuntly } = createNuntlyClient(cmd);
      const body = opts.file ? readInput(opts.file) : !process.stdin.isTTY ? readInput('-') : {
        name: opts.name,
        externalId: opts.externalId
      };
      const result = await withSpinner('Creating...', () => nuntly.namespaces.create(body as CreateNamespaceRequest));
      printResult(result, opts);
    } catch (error) {
      printError(error, opts);
    }
  });

namespacesCommand
  .command('delete')
  .description('Soft-delete a namespace. Rejects if it has active inboxes.')
  .argument('<namespace-id>', 'The namespaceId')
  .option('--format <fmt>', 'Output format: json, raw, yaml, csv, markdown, table, quiet')
  .option('-q, --quiet', 'Shorthand for --format quiet')
  .option('--raw', 'Shorthand for --format raw')
  .option('--fields <fields>', 'Comma-separated list of fields to display')
  .option('--no-header', 'Omit column headers in table/csv output')
  .addHelpText('after', '\nExample:\n  $ nuntly namespaces delete ns_2345uvwx')
  .action(async (namespaceId, opts, cmd) => {
    try {
      const { nuntly, globals } = createNuntlyClient(cmd);
      if (!await confirmDelete('namespaces', namespaceId, !!globals.yes)) return;
      const result = await withSpinner('Deleting...', () => nuntly.namespaces.delete(namespaceId));
      printResult(result, opts);
    } catch (error) {
      printError(error, opts);
    }
  });

namespacesCommand
  .command('list')
  .description('List all namespaces.')
  .option('--cursor <cursor>', 'Pagination cursor')
  .option('--limit <limit>', 'Max items to return')
  .option('--all', 'Fetch all pages (auto-paginate)')
  .option('--format <fmt>', 'Output format: json, raw, yaml, csv, markdown, table, quiet')
  .option('-q, --quiet', 'Shorthand for --format quiet')
  .option('--raw', 'Shorthand for --format raw')
  .option('--fields <fields>', 'Comma-separated list of fields to display')
  .option('--no-header', 'Omit column headers in table/csv output')
  .addHelpText('after', '\nExample:\n  $ nuntly namespaces list\n  $ nuntly namespaces list --format json | jq \'.data[].id\'')
  .action(async (opts, cmd) => {
    try {
      const { nuntly } = createNuntlyClient(cmd);
      if (opts.all) {
        const page = await withSpinner('Loading...', () => nuntly.namespaces.list({ cursor: opts.cursor, limit: opts.limit ? Number(opts.limit) : undefined }));
        const all = [] as typeof page.data;
        for await (const item of page) all.push(item);
        printResult({ data: all }, opts);
      } else {
        const page = await withSpinner('Loading...', () => nuntly.namespaces.list({ cursor: opts.cursor, limit: opts.limit ? Number(opts.limit) : undefined }));
        printResult({ data: page.data, nextCursor: page.nextCursor }, opts);
      }
    } catch (error) {
      printError(error, opts);
    }
  });

namespacesCommand
  .command('retrieve')
  .description('Retrieve a namespace with inbox stats.')
  .argument('<namespace-id>', 'The namespaceId')
  .option('--format <fmt>', 'Output format: json, raw, yaml, csv, markdown, table, quiet')
  .option('-q, --quiet', 'Shorthand for --format quiet')
  .option('--raw', 'Shorthand for --format raw')
  .option('--fields <fields>', 'Comma-separated list of fields to display')
  .option('--no-header', 'Omit column headers in table/csv output')
  .addHelpText('after', '\nExample:\n  $ nuntly namespaces retrieve ns_2345uvwx')
  .action(async (namespaceId, opts, cmd) => {
    try {
      const { nuntly } = createNuntlyClient(cmd);
      const result = await withSpinner('Loading...', () => nuntly.namespaces.retrieve(namespaceId));
      printResult(result, opts);
    } catch (error) {
      printError(error, opts);
    }
  });

namespacesCommand
  .command('update')
  .description('Update a namespace.')
  .argument('<namespace-id>', 'The namespaceId')
  .option('--name <value>', 'The display name of the namespace.')
  .option('--external-id <value>', 'An optional external identifier for the namespace.')
  .option('--file <path>', 'Read JSON body from file (use - for stdin)')
  .option('--format <fmt>', 'Output format: json, raw, yaml, csv, markdown, table, quiet')
  .option('-q, --quiet', 'Shorthand for --format quiet')
  .option('--raw', 'Shorthand for --format raw')
  .option('--fields <fields>', 'Comma-separated list of fields to display')
  .option('--no-header', 'Omit column headers in table/csv output')
  .addHelpText('after', '\nExample:\n  $ nuntly namespaces update ns_2345uvwx --name my-resource\n  $ cat payload.json | nuntly namespaces update ns_2345uvwx\n  $ nuntly namespaces update ns_2345uvwx --file payload.json')
  .action(async (namespaceId, opts, cmd) => {
    try {
      const { nuntly } = createNuntlyClient(cmd);
      const body = opts.file ? readInput(opts.file) : !process.stdin.isTTY ? readInput('-') : {
        name: opts.name,
        externalId: opts.externalId
      };
      const result = await withSpinner('Updating...', () => nuntly.namespaces.update(namespaceId, body as UpdateNamespaceRequest));
      printResult(result, opts);
    } catch (error) {
      printError(error, opts);
    }
  });

