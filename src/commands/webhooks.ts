import { Command } from '@commander-js/extra-typings';
import { Nuntly, type UpdateWebhookRequest, type CreateWebhookRequest } from '@nuntly/sdk';
import { resolveApiKey, resolveBaseUrl, confirmDelete } from '../auth.js';
import { CLI_VERSION } from '../version.js';
import { printResult, printError } from '../output.js';
import { withSpinner } from '../spinner.js';
import { readInput } from '../files.js';

export const webhooksCommand = new Command('webhooks')
  .description('Webhooks resource.');

const eventsSub = new Command('events');
webhooksCommand.addCommand(eventsSub);

eventsSub
  .command('list')
  .description('Returns recent webhook events across all registered endpoints.')
  .option('--cursor <cursor>', 'Pagination cursor')
  .option('--limit <limit>', 'Max items to return')
  .option('--format <fmt>', 'Output format: json, raw, yaml, csv, markdown, table, quiet')
  .option('-q, --quiet', 'Shorthand for --format quiet')
  .option('--raw', 'Shorthand for --format raw')
  .option('--fields <fields>', 'Comma-separated list of fields to display')
  .option('--no-header', 'Omit column headers in table/csv output')
  .addHelpText('after', '\nExample:\n  $ nuntly webhooks events list\n  $ nuntly webhooks events list --format json | jq \'.data[].id\'')
  .action(async (opts) => {
    try {
      const nuntly = new Nuntly({ apiKey: resolveApiKey(), baseUrl: resolveBaseUrl(), appInfo: { name: '@nuntly/cli', version: CLI_VERSION } });
      const page = await withSpinner('Loading...', () => nuntly.webhooks.events.list({ cursor: opts.cursor, limit: opts.limit ? Number(opts.limit) : undefined }));
      printResult({ data: page.data, nextCursor: page.nextCursor }, opts);
    } catch (error) {
      printError(error, opts);
    }
  });

eventsSub
  .command('replay')
  .description('Re-deliver a webhook event to its endpoint. Useful for retrying failed deliveries.')
  .argument('<id>', 'The id')
  .argument('<event-id>', 'The eventId')
  .option('--format <fmt>', 'Output format: json, raw, yaml, csv, markdown, table, quiet')
  .option('-q, --quiet', 'Shorthand for --format quiet')
  .option('--raw', 'Shorthand for --format raw')
  .option('--fields <fields>', 'Comma-separated list of fields to display')
  .option('--no-header', 'Omit column headers in table/csv output')
  .addHelpText('after', '\nExample:\n  $ nuntly webhooks events replay wh_9012ijkl wh_9012ijkl')
  .action(async (id, eventId, opts) => {
    try {
      const nuntly = new Nuntly({ apiKey: resolveApiKey(), baseUrl: resolveBaseUrl(), appInfo: { name: '@nuntly/cli', version: CLI_VERSION } });
      const result = await withSpinner('Creating...', () => nuntly.webhooks.events.replay(id, eventId));
      printResult(result, opts);
    } catch (error) {
      printError(error, opts);
    }
  });

eventsSub
  .command('deliveries')
  .description('Returns all delivery attempts for a webhook event, including HTTP status codes and response times.')
  .argument('<id>', 'The id')
  .argument('<event-id>', 'The eventId')
  .option('--format <fmt>', 'Output format: json, raw, yaml, csv, markdown, table, quiet')
  .option('-q, --quiet', 'Shorthand for --format quiet')
  .option('--raw', 'Shorthand for --format raw')
  .option('--fields <fields>', 'Comma-separated list of fields to display')
  .option('--no-header', 'Omit column headers in table/csv output')
  .addHelpText('after', '\nExample:\n  $ nuntly webhooks events deliveries wh_9012ijkl wh_9012ijkl')
  .action(async (id, eventId, opts) => {
    try {
      const nuntly = new Nuntly({ apiKey: resolveApiKey(), baseUrl: resolveBaseUrl(), appInfo: { name: '@nuntly/cli', version: CLI_VERSION } });
      const result = await withSpinner('Loading...', () => nuntly.webhooks.events.deliveries(id, eventId));
      printResult(result, opts);
    } catch (error) {
      printError(error, opts);
    }
  });

webhooksCommand
  .command('retrieve')
  .description('Returns a webhook endpoint with its URL, subscribed events, and configuration.')
  .argument('<id>', 'The id')
  .option('--format <fmt>', 'Output format: json, raw, yaml, csv, markdown, table, quiet')
  .option('-q, --quiet', 'Shorthand for --format quiet')
  .option('--raw', 'Shorthand for --format raw')
  .option('--fields <fields>', 'Comma-separated list of fields to display')
  .option('--no-header', 'Omit column headers in table/csv output')
  .addHelpText('after', '\nExample:\n  $ nuntly webhooks retrieve wh_9012ijkl')
  .action(async (id, opts) => {
    try {
      const nuntly = new Nuntly({ apiKey: resolveApiKey(), baseUrl: resolveBaseUrl(), appInfo: { name: '@nuntly/cli', version: CLI_VERSION } });
      const result = await withSpinner('Loading...', () => nuntly.webhooks.retrieve(id));
      printResult(result, opts);
    } catch (error) {
      printError(error, opts);
    }
  });

webhooksCommand
  .command('update')
  .description('Update the endpoint URL, subscribed event types, or rotate the signing secret.')
  .argument('<id>', 'The id')
  .option('--name <value>', 'The name of the webhook')
  .option('--endpoint-url <value>', 'The endpoint URL of the webhook')
  .option('--events <value>', 'The event types to subscribe to')
  .option('--status <value>', 'The status of the webhook.')
  .option('--rotate-secret', 'If true, a new signing secret will be generated')
  .option('--file <path>', 'Read JSON body from file (use - for stdin)')
  .option('--format <fmt>', 'Output format: json, raw, yaml, csv, markdown, table, quiet')
  .option('-q, --quiet', 'Shorthand for --format quiet')
  .option('--raw', 'Shorthand for --format raw')
  .option('--fields <fields>', 'Comma-separated list of fields to display')
  .option('--no-header', 'Omit column headers in table/csv output')
  .addHelpText('after', '\nExample:\n  $ nuntly webhooks update wh_9012ijkl\n  $ cat payload.json | nuntly webhooks update wh_9012ijkl\n  $ nuntly webhooks update wh_9012ijkl --file payload.json')
  .action(async (id, opts) => {
    try {
      const nuntly = new Nuntly({ apiKey: resolveApiKey(), baseUrl: resolveBaseUrl(), appInfo: { name: '@nuntly/cli', version: CLI_VERSION } });
      const body = opts.file ? readInput(opts.file) : !process.stdin.isTTY ? readInput('-') : {
        name: opts.name,
        endpointUrl: opts.endpointUrl,
        events: opts.events != null ? (opts.events as string).split(',') : undefined,
        status: opts.status,
        rotateSecret: opts.rotateSecret
      };
      const result = await withSpinner('Updating...', () => nuntly.webhooks.update(id, body as UpdateWebhookRequest));
      printResult(result, opts);
    } catch (error) {
      printError(error, opts);
    }
  });

webhooksCommand
  .command('delete')
  .description('Remove a webhook endpoint. No further events will be delivered to this URL.')
  .argument('<id>', 'The id')
  .option('--format <fmt>', 'Output format: json, raw, yaml, csv, markdown, table, quiet')
  .option('-q, --quiet', 'Shorthand for --format quiet')
  .option('--raw', 'Shorthand for --format raw')
  .option('--fields <fields>', 'Comma-separated list of fields to display')
  .option('--no-header', 'Omit column headers in table/csv output')
  .addHelpText('after', '\nExample:\n  $ nuntly webhooks delete wh_9012ijkl')
  .action(async (id, opts) => {
    try {
      if (!await confirmDelete('webhooks', id)) return;
      const nuntly = new Nuntly({ apiKey: resolveApiKey(), baseUrl: resolveBaseUrl(), appInfo: { name: '@nuntly/cli', version: CLI_VERSION } });
      const result = await withSpinner('Deleting...', () => nuntly.webhooks.delete(id));
      printResult(result, opts);
    } catch (error) {
      printError(error, opts);
    }
  });

webhooksCommand
  .command('create')
  .description('Register an endpoint to start receiving webhook events for your organization.')
  .option('--name <value>', 'The name of the webhook')
  .option('--endpoint-url <value>', 'The endpoint URL of the webhook (required)')
  .option('--status <value>', 'The status of the webhook.')
  .option('--events <value>', 'The event types to subscribe to (required)')
  .option('--file <path>', 'Read JSON body from file (use - for stdin)')
  .option('--format <fmt>', 'Output format: json, raw, yaml, csv, markdown, table, quiet')
  .option('-q, --quiet', 'Shorthand for --format quiet')
  .option('--raw', 'Shorthand for --format raw')
  .option('--fields <fields>', 'Comma-separated list of fields to display')
  .option('--no-header', 'Omit column headers in table/csv output')
  .addHelpText('after', '\nExample:\n  $ nuntly webhooks create --endpoint-url https://acme.com/webhooks --events email.sent,email.delivered\n  $ cat payload.json | nuntly webhooks create\n  $ nuntly webhooks create --file payload.json')
  .action(async (opts) => {
    try {
      const nuntly = new Nuntly({ apiKey: resolveApiKey(), baseUrl: resolveBaseUrl(), appInfo: { name: '@nuntly/cli', version: CLI_VERSION } });
      const body = opts.file ? readInput(opts.file) : !process.stdin.isTTY ? readInput('-') : {
        name: opts.name,
        endpointUrl: opts.endpointUrl,
        status: opts.status,
        events: (opts.events as string).split(',')
      };
      const result = await withSpinner('Creating...', () => nuntly.webhooks.create(body as CreateWebhookRequest));
      printResult(result, opts);
    } catch (error) {
      printError(error, opts);
    }
  });

webhooksCommand
  .command('list')
  .description('Returns all registered webhook endpoints for the organization.')
  .option('--cursor <cursor>', 'Pagination cursor')
  .option('--limit <limit>', 'Max items to return')
  .option('--format <fmt>', 'Output format: json, raw, yaml, csv, markdown, table, quiet')
  .option('-q, --quiet', 'Shorthand for --format quiet')
  .option('--raw', 'Shorthand for --format raw')
  .option('--fields <fields>', 'Comma-separated list of fields to display')
  .option('--no-header', 'Omit column headers in table/csv output')
  .addHelpText('after', '\nExample:\n  $ nuntly webhooks list\n  $ nuntly webhooks list --format json | jq \'.data[].id\'')
  .action(async (opts) => {
    try {
      const nuntly = new Nuntly({ apiKey: resolveApiKey(), baseUrl: resolveBaseUrl(), appInfo: { name: '@nuntly/cli', version: CLI_VERSION } });
      const page = await withSpinner('Loading...', () => nuntly.webhooks.list({ cursor: opts.cursor, limit: opts.limit ? Number(opts.limit) : undefined }));
      printResult({ data: page.data, nextCursor: page.nextCursor }, opts);
    } catch (error) {
      printError(error, opts);
    }
  });

