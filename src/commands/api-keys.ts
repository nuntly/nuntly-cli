import { Command, Option } from '@commander-js/extra-typings';
import type { CreateApiKeyRequest, UpdateApiKeyRequest } from '@nuntly/sdk';
import { confirmAction, createNuntlyClient } from '../auth.js';
import { resolveBody } from '../files.js';
import { parseFormat, printError, printResult } from '../output.js';
import { withSpinner } from '../spinner.js';

export const apiKeysCommand = new Command('api-keys').description('ApiKeys resource.');

apiKeysCommand
  .command('create')
  .description(
    'Creates an API key with full access or send-only access, optionally limited to chosen domains. The secret key value is returned only in this response.',
  )
  .option('--name <value>', 'The name of the api key')
  .addOption(
    new Option('--status <value>', 'The status for the api key').choices(['enabled', 'disabled', 'revoked'] as const),
  )
  .addOption(
    new Option('--permission <value>', 'The permission type for the api key').choices([
      'fullAccess',
      'sendingAccess',
    ] as const),
  )
  .option(
    '--domain-ids <value>',
    'The domain ids to restrict the api key to (only for sendingAccess) (repeatable)',
    (value: string, acc: string[] = []) => acc.concat(value),
    [] as string[],
  )
  .option('--file <path>', 'Read JSON body from file (use - for stdin)')
  .option('--format <fmt>', 'Output format: json, raw, yaml, csv, markdown, table, quiet', parseFormat)
  .option('-q, --quiet', 'Shorthand for --format quiet')
  .option('--raw', 'Shorthand for --format raw')
  .option('--fields <fields>', 'Comma-separated list of fields to display')
  .option('--no-header', 'Omit column headers in table/csv output')
  .addHelpText(
    'after',
    '\nExample:\n  $ nuntly api-keys create --name Production\n  $ cat payload.json | nuntly api-keys create --file -\n  $ nuntly api-keys create --file payload.json',
  )
  .action(async (opts, cmd) => {
    try {
      const { nuntly } = createNuntlyClient(cmd);
      const body = resolveBody(opts.file, {
        name: opts.name,
        status: opts.status,
        permission: opts.permission,
        domainIds: (opts.domainIds as string[] | undefined)?.length ? (opts.domainIds as string[]) : undefined,
      });
      const result = await withSpinner('Creating...', () => nuntly.apiKeys.create(body as CreateApiKeyRequest));
      printResult(result, opts);
    } catch (error) {
      printError(error, opts);
    }
  });

apiKeysCommand
  .command('delete')
  .description(
    'Permanently deletes an API key. Any request that authenticates with this key is rejected from then on. This cannot be undone.',
  )
  .argument('<id>', 'The id')
  .option('--format <fmt>', 'Output format: json, raw, yaml, csv, markdown, table, quiet', parseFormat)
  .option('-q, --quiet', 'Shorthand for --format quiet')
  .option('--raw', 'Shorthand for --format raw')
  .option('--fields <fields>', 'Comma-separated list of fields to display')
  .option('--no-header', 'Omit column headers in table/csv output')
  .addHelpText('after', '\nExample:\n  $ nuntly api-keys delete apk_01ka8k8s80gvx9604cn9am5st4')
  .action(async (id, opts, cmd) => {
    try {
      const { nuntly, globals } = createNuntlyClient(cmd);
      if (!(await confirmAction('delete', 'api key', id, !!globals.yes))) return;
      const result = await withSpinner('Deleting...', () => nuntly.apiKeys.delete(id));
      printResult(result, opts);
    } catch (error) {
      printError(error, opts);
    }
  });

apiKeysCommand
  .command('list')
  .description(
    'Lists the API keys of your organization, newest first, with cursor pagination. Each key shows its name, status, creation date, and a short token hint.',
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
    "\nExample:\n  $ nuntly api-keys list\n  $ nuntly api-keys list --format json | jq '.data[].id'",
  )
  .action(async (opts, cmd) => {
    try {
      const { nuntly } = createNuntlyClient(cmd);
      if (opts.all) {
        const page = await withSpinner('Loading...', () =>
          nuntly.apiKeys.list({ cursor: opts.cursor, limit: opts.limit ? Number(opts.limit) : undefined }),
        );
        const all = [] as typeof page.data;
        for await (const item of page) all.push(item);
        printResult({ data: all, nextCursor: null }, opts);
      } else {
        const page = await withSpinner('Loading...', () =>
          nuntly.apiKeys.list({ cursor: opts.cursor, limit: opts.limit ? Number(opts.limit) : undefined }),
        );
        printResult({ data: page.data, nextCursor: page.nextCursor }, opts);
      }
    } catch (error) {
      printError(error, opts);
    }
  });

apiKeysCommand
  .command('retrieve')
  .description(
    'Retrieves an API key by id with its name, status, creation date, and a short token hint. The full secret key value is never returned after creation.',
  )
  .argument('<id>', 'The id')
  .option('--format <fmt>', 'Output format: json, raw, yaml, csv, markdown, table, quiet', parseFormat)
  .option('-q, --quiet', 'Shorthand for --format quiet')
  .option('--raw', 'Shorthand for --format raw')
  .option('--fields <fields>', 'Comma-separated list of fields to display')
  .option('--no-header', 'Omit column headers in table/csv output')
  .addHelpText('after', '\nExample:\n  $ nuntly api-keys retrieve apk_01ka8k8s80gvx9604cn9am5st4')
  .action(async (id, opts, cmd) => {
    try {
      const { nuntly } = createNuntlyClient(cmd);
      const result = await withSpinner('Loading...', () => nuntly.apiKeys.retrieve(id));
      printResult(result, opts);
    } catch (error) {
      printError(error, opts);
    }
  });

apiKeysCommand
  .command('update')
  .description(
    'Updates the name of an API key, enables or disables it, or changes its access level and domain restrictions. Returns the id of the updated key.',
  )
  .argument('<id>', 'The id')
  .option('--name <value>', 'The name of the api key')
  .addOption(new Option('--status <value>', 'status').choices(['enabled', 'disabled'] as const))
  .addOption(
    new Option('--permission <value>', 'The permission type for the api key').choices([
      'fullAccess',
      'sendingAccess',
    ] as const),
  )
  .option(
    '--domain-ids <value>',
    'The domain ids to restrict the api key to (only for sendingAccess) (repeatable)',
    (value: string, acc: string[] = []) => acc.concat(value),
    [] as string[],
  )
  .option('--file <path>', 'Read JSON body from file (use - for stdin)')
  .option('--format <fmt>', 'Output format: json, raw, yaml, csv, markdown, table, quiet', parseFormat)
  .option('-q, --quiet', 'Shorthand for --format quiet')
  .option('--raw', 'Shorthand for --format raw')
  .option('--fields <fields>', 'Comma-separated list of fields to display')
  .option('--no-header', 'Omit column headers in table/csv output')
  .addHelpText(
    'after',
    '\nExample:\n  $ nuntly api-keys update apk_01ka8k8s80gvx9604cn9am5st4 --name Production\n  $ cat payload.json | nuntly api-keys update apk_01ka8k8s80gvx9604cn9am5st4 --file -\n  $ nuntly api-keys update apk_01ka8k8s80gvx9604cn9am5st4 --file payload.json',
  )
  .action(async (id, opts, cmd) => {
    try {
      const { nuntly } = createNuntlyClient(cmd);
      const body = resolveBody(opts.file, {
        name: opts.name,
        status: opts.status,
        permission: opts.permission,
        domainIds: (opts.domainIds as string[] | undefined)?.length ? (opts.domainIds as string[]) : undefined,
      });
      const result = await withSpinner('Updating...', () => nuntly.apiKeys.update(id, body as UpdateApiKeyRequest));
      printResult(result, opts);
    } catch (error) {
      printError(error, opts);
    }
  });
