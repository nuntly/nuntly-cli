import { Command } from '@commander-js/extra-typings';
import type { CreateApiKeyRequest, UpdateApiKeyRequest } from '@nuntly/sdk';
import { createNuntlyClient, confirmDelete } from '../auth.js';
import { printResult, printError } from '../output.js';
import { withSpinner } from '../spinner.js';
import { readInput } from '../files.js';

export const apiKeysCommand = new Command('api-keys')
  .description('ApiKeys resource.');

apiKeysCommand
  .command('create')
  .description('Generate a new API key. The key value is only returned once. Store it securely.')
  .option('--name <value>', 'The name of the api key')
  .option('--status <value>', 'The status for the api key')
  .option('--permission <value>', 'The permission type for the api key (required)')
  .option('--domain-ids <value>', 'The domain ids to restrict the api key to (only for sendingAccess) (repeatable)', (value: string, acc: string[] = []) => acc.concat(value), [] as string[])
  .option('--file <path>', 'Read JSON body from file (use - for stdin)')
  .option('--format <fmt>', 'Output format: json, raw, yaml, csv, markdown, table, quiet')
  .option('-q, --quiet', 'Shorthand for --format quiet')
  .option('--raw', 'Shorthand for --format raw')
  .option('--fields <fields>', 'Comma-separated list of fields to display')
  .option('--no-header', 'Omit column headers in table/csv output')
  .addHelpText('after', '\nExample:\n  $ nuntly api-keys create --permission sendingAccess\n  $ cat payload.json | nuntly api-keys create\n  $ nuntly api-keys create --file payload.json')
  .action(async (opts, cmd) => {
    try {
      const { nuntly } = createNuntlyClient(cmd);
      const body = opts.file ? readInput(opts.file) : !process.stdin.isTTY ? readInput('-') : {
        name: opts.name,
        status: opts.status,
        permission: opts.permission,
        domainIds: (opts.domainIds as string[] | undefined)?.length ? (opts.domainIds as string[]) : undefined
      };
      const result = await withSpinner('Creating...', () => nuntly.apiKeys.create(body as CreateApiKeyRequest));
      printResult(result, opts);
    } catch (error) {
      printError(error, opts);
    }
  });

apiKeysCommand
  .command('delete')
  .description('Revoke an API key. Requests authenticating with this key will be rejected immediately.')
  .argument('<id>', 'The id')
  .option('--format <fmt>', 'Output format: json, raw, yaml, csv, markdown, table, quiet')
  .option('-q, --quiet', 'Shorthand for --format quiet')
  .option('--raw', 'Shorthand for --format raw')
  .option('--fields <fields>', 'Comma-separated list of fields to display')
  .option('--no-header', 'Omit column headers in table/csv output')
  .addHelpText('after', '\nExample:\n  $ nuntly api-keys delete id_example')
  .action(async (id, opts, cmd) => {
    try {
      const { nuntly, globals } = createNuntlyClient(cmd);
      if (!await confirmDelete('api keys', id, !!globals.yes)) return;
      const result = await withSpinner('Deleting...', () => nuntly.apiKeys.delete(id));
      printResult(result, opts);
    } catch (error) {
      printError(error, opts);
    }
  });

apiKeysCommand
  .command('list')
  .description('Returns all API keys for the organization. Key values are never included in list responses.')
  .option('--cursor <cursor>', 'Pagination cursor')
  .option('--limit <limit>', 'Max items to return')
  .option('--all', 'Fetch all pages (auto-paginate)')
  .option('--format <fmt>', 'Output format: json, raw, yaml, csv, markdown, table, quiet')
  .option('-q, --quiet', 'Shorthand for --format quiet')
  .option('--raw', 'Shorthand for --format raw')
  .option('--fields <fields>', 'Comma-separated list of fields to display')
  .option('--no-header', 'Omit column headers in table/csv output')
  .addHelpText('after', '\nExample:\n  $ nuntly api-keys list\n  $ nuntly api-keys list --format json | jq \'.data[].id\'')
  .action(async (opts, cmd) => {
    try {
      const { nuntly } = createNuntlyClient(cmd);
      if (opts.all) {
        const page = await withSpinner('Loading...', () => nuntly.apiKeys.list({ cursor: opts.cursor, limit: opts.limit ? Number(opts.limit) : undefined }));
        const all = [] as typeof page.data;
        for await (const item of page) all.push(item);
        printResult({ data: all }, opts);
      } else {
        const page = await withSpinner('Loading...', () => nuntly.apiKeys.list({ cursor: opts.cursor, limit: opts.limit ? Number(opts.limit) : undefined }));
        printResult({ data: page.data, nextCursor: page.nextCursor }, opts);
      }
    } catch (error) {
      printError(error, opts);
    }
  });

apiKeysCommand
  .command('retrieve')
  .description('Returns API key metadata. The key value is never returned after creation.')
  .argument('<id>', 'The id')
  .option('--format <fmt>', 'Output format: json, raw, yaml, csv, markdown, table, quiet')
  .option('-q, --quiet', 'Shorthand for --format quiet')
  .option('--raw', 'Shorthand for --format raw')
  .option('--fields <fields>', 'Comma-separated list of fields to display')
  .option('--no-header', 'Omit column headers in table/csv output')
  .addHelpText('after', '\nExample:\n  $ nuntly api-keys retrieve id_example')
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
  .description('Update the key name, permissions, or restrict it to specific sending domains.')
  .argument('<id>', 'The id')
  .option('--name <value>', 'The name of the api key')
  .option('--status <value>', 'status')
  .option('--permission <value>', 'The permission type for the api key')
  .option('--domain-ids <value>', 'The domain ids to restrict the api key to (only for sendingAccess) (repeatable)', (value: string, acc: string[] = []) => acc.concat(value), [] as string[])
  .option('--file <path>', 'Read JSON body from file (use - for stdin)')
  .option('--format <fmt>', 'Output format: json, raw, yaml, csv, markdown, table, quiet')
  .option('-q, --quiet', 'Shorthand for --format quiet')
  .option('--raw', 'Shorthand for --format raw')
  .option('--fields <fields>', 'Comma-separated list of fields to display')
  .option('--no-header', 'Omit column headers in table/csv output')
  .addHelpText('after', '\nExample:\n  $ nuntly api-keys update id_example --name my-resource\n  $ cat payload.json | nuntly api-keys update id_example\n  $ nuntly api-keys update id_example --file payload.json')
  .action(async (id, opts, cmd) => {
    try {
      const { nuntly } = createNuntlyClient(cmd);
      const body = opts.file ? readInput(opts.file) : !process.stdin.isTTY ? readInput('-') : {
        name: opts.name,
        status: opts.status,
        permission: opts.permission,
        domainIds: (opts.domainIds as string[] | undefined)?.length ? (opts.domainIds as string[]) : undefined
      };
      const result = await withSpinner('Updating...', () => nuntly.apiKeys.update(id, body as UpdateApiKeyRequest));
      printResult(result, opts);
    } catch (error) {
      printError(error, opts);
    }
  });

