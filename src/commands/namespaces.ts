import { Command } from '@commander-js/extra-typings';
import type { CreateNamespaceRequest, UpdateNamespaceRequest } from '@nuntly/sdk';
import { confirmAction, createNuntlyClient } from '../auth.js';
import { resolveBody } from '../files.js';
import { parseFormat, printError, printResult } from '../output.js';
import { withSpinner } from '../spinner.js';
import { nullable } from '../values.js';

export const namespacesCommand = new Command('namespaces').description('Namespaces resource.');

const inboxesSub = new Command('inboxes');
namespacesCommand.addCommand(inboxesSub);

inboxesSub
  .command('list')
  .description(
    'Lists the active inboxes assigned to a namespace, newest first, with cursor pagination. Returns the same inbox objects as the inbox list.',
  )
  .argument('<namespace-id>', 'The namespaceId')
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
    "\nExample:\n  $ nuntly namespaces inboxes list ns_01kabn43yqyxn2bx4ve84mczd3\n  $ nuntly namespaces inboxes list ns_01kabn43yqyxn2bx4ve84mczd3 --format json | jq '.data[].id'",
  )
  .action(async (namespaceId, opts, cmd) => {
    try {
      const { nuntly } = createNuntlyClient(cmd);
      if (opts.all) {
        const page = await withSpinner('Loading...', () =>
          nuntly.namespaces.inboxes.list(namespaceId, {
            cursor: opts.cursor,
            limit: opts.limit ? Number(opts.limit) : undefined,
          }),
        );
        const all = [] as typeof page.data;
        for await (const item of page) all.push(item);
        printResult({ data: all, nextCursor: null }, opts);
      } else {
        const page = await withSpinner('Loading...', () =>
          nuntly.namespaces.inboxes.list(namespaceId, {
            cursor: opts.cursor,
            limit: opts.limit ? Number(opts.limit) : undefined,
          }),
        );
        printResult({ data: page.data, nextCursor: page.nextCursor }, opts);
      }
    } catch (error) {
      printError(error, opts);
    }
  });

namespacesCommand
  .command('create')
  .description(
    'Creates a namespace to group inboxes, with a display name and an optional external id that maps it to a customer or tenant in your own system.',
  )
  .option('--name <value>', 'The display name of the namespace. (required)')
  .option('--external-id <value>', 'An optional external identifier for the namespace.')
  .option('--file <path>', 'Read JSON body from file (use - for stdin)')
  .option('--format <fmt>', 'Output format: json, raw, yaml, csv, markdown, table, quiet', parseFormat)
  .option('-q, --quiet', 'Shorthand for --format quiet')
  .option('--raw', 'Shorthand for --format raw')
  .option('--fields <fields>', 'Comma-separated list of fields to display')
  .option('--no-header', 'Omit column headers in table/csv output')
  .addHelpText(
    'after',
    '\nExample:\n  $ nuntly namespaces create --name "Customer support"\n  $ cat payload.json | nuntly namespaces create --file -\n  $ nuntly namespaces create --file payload.json',
  )
  .action(async (opts, cmd) => {
    try {
      const { nuntly } = createNuntlyClient(cmd);
      const body = resolveBody(opts.file, {
        name: opts.name,
        externalId: opts.externalId,
      });
      const result = await withSpinner('Creating...', () => nuntly.namespaces.create(body as CreateNamespaceRequest));
      printResult(result, opts);
    } catch (error) {
      printError(error, opts);
    }
  });

namespacesCommand
  .command('delete')
  .description(
    'Deletes a namespace by id. The request is rejected with a validation error while the namespace still has active inboxes, so delete them first.',
  )
  .argument('<namespace-id>', 'The namespaceId')
  .option('--format <fmt>', 'Output format: json, raw, yaml, csv, markdown, table, quiet', parseFormat)
  .option('-q, --quiet', 'Shorthand for --format quiet')
  .option('--raw', 'Shorthand for --format raw')
  .option('--fields <fields>', 'Comma-separated list of fields to display')
  .option('--no-header', 'Omit column headers in table/csv output')
  .addHelpText('after', '\nExample:\n  $ nuntly namespaces delete ns_01kabn43yqyxn2bx4ve84mczd3')
  .action(async (namespaceId, opts, cmd) => {
    try {
      const { nuntly, globals } = createNuntlyClient(cmd);
      if (!(await confirmAction('delete', 'namespace', namespaceId, !!globals.yes))) return;
      const result = await withSpinner('Deleting...', () => nuntly.namespaces.delete(namespaceId));
      printResult(result, opts);
    } catch (error) {
      printError(error, opts);
    }
  });

namespacesCommand
  .command('list')
  .description(
    'Lists the namespaces of your organization, newest first, with cursor pagination. Each item includes the name and the optional external id.',
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
    "\nExample:\n  $ nuntly namespaces list\n  $ nuntly namespaces list --format json | jq '.data[].id'",
  )
  .action(async (opts, cmd) => {
    try {
      const { nuntly } = createNuntlyClient(cmd);
      if (opts.all) {
        const page = await withSpinner('Loading...', () =>
          nuntly.namespaces.list({ cursor: opts.cursor, limit: opts.limit ? Number(opts.limit) : undefined }),
        );
        const all = [] as typeof page.data;
        for await (const item of page) all.push(item);
        printResult({ data: all, nextCursor: null }, opts);
      } else {
        const page = await withSpinner('Loading...', () =>
          nuntly.namespaces.list({ cursor: opts.cursor, limit: opts.limit ? Number(opts.limit) : undefined }),
        );
        printResult({ data: page.data, nextCursor: page.nextCursor }, opts);
      }
    } catch (error) {
      printError(error, opts);
    }
  });

namespacesCommand
  .command('retrieve')
  .description(
    'Retrieves a namespace by id with its name, its optional external id, and inbox counts, including how many of its inboxes are currently active.',
  )
  .argument('<namespace-id>', 'The namespaceId')
  .option('--format <fmt>', 'Output format: json, raw, yaml, csv, markdown, table, quiet', parseFormat)
  .option('-q, --quiet', 'Shorthand for --format quiet')
  .option('--raw', 'Shorthand for --format raw')
  .option('--fields <fields>', 'Comma-separated list of fields to display')
  .option('--no-header', 'Omit column headers in table/csv output')
  .addHelpText('after', '\nExample:\n  $ nuntly namespaces retrieve ns_01kabn43yqyxn2bx4ve84mczd3')
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
  .description(
    'Updates the display name or external id of a namespace. Set the external id to null to clear it. Returns the id of the updated namespace.',
  )
  .argument('<namespace-id>', 'The namespaceId')
  .option('--name <value>', 'The display name of the namespace.')
  .option('--external-id <value>', 'An optional external identifier for the namespace. (null to clear)')
  .option('--file <path>', 'Read JSON body from file (use - for stdin)')
  .option('--format <fmt>', 'Output format: json, raw, yaml, csv, markdown, table, quiet', parseFormat)
  .option('-q, --quiet', 'Shorthand for --format quiet')
  .option('--raw', 'Shorthand for --format raw')
  .option('--fields <fields>', 'Comma-separated list of fields to display')
  .option('--no-header', 'Omit column headers in table/csv output')
  .addHelpText(
    'after',
    '\nExample:\n  $ nuntly namespaces update ns_01kabn43yqyxn2bx4ve84mczd3 --name "Customer support"\n  $ cat payload.json | nuntly namespaces update ns_01kabn43yqyxn2bx4ve84mczd3 --file -\n  $ nuntly namespaces update ns_01kabn43yqyxn2bx4ve84mczd3 --file payload.json',
  )
  .action(async (namespaceId, opts, cmd) => {
    try {
      const { nuntly } = createNuntlyClient(cmd);
      const body = resolveBody(opts.file, {
        name: opts.name,
        externalId: nullable(opts.externalId),
      });
      const result = await withSpinner('Updating...', () =>
        nuntly.namespaces.update(namespaceId, body as UpdateNamespaceRequest),
      );
      printResult(result, opts);
    } catch (error) {
      printError(error, opts);
    }
  });
