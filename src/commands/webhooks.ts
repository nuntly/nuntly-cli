import { Command, Option } from '@commander-js/extra-typings';
import type { CreateWebhookRequest, UpdateWebhookRequest } from '@nuntly/sdk';
import { confirmAction, createNuntlyClient } from '../auth.js';
import { resolveBody } from '../files.js';
import { parseFormat, printError, printResult } from '../output.js';
import { withSpinner } from '../spinner.js';
import { choiceList } from '../values.js';

export const webhooksCommand = new Command('webhooks').description('Webhooks resource.');

const eventsSub = new Command('events');
webhooksCommand.addCommand(eventsSub);

eventsSub
  .command('list')
  .description(
    'Lists the webhook events of the last 48 hours across all your endpoints, with their delivery status and payload. Results use cursor pagination.',
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
    "\nExample:\n  $ nuntly webhooks events list\n  $ nuntly webhooks events list --format json | jq '.data[].id'",
  )
  .action(async (opts, cmd) => {
    try {
      const { nuntly } = createNuntlyClient(cmd);
      if (opts.all) {
        const page = await withSpinner('Loading...', () =>
          nuntly.webhooks.events.list({ cursor: opts.cursor, limit: opts.limit ? Number(opts.limit) : undefined }),
        );
        const all = [] as typeof page.data;
        for await (const item of page) all.push(item);
        printResult({ data: all, nextCursor: null }, opts);
      } else {
        const page = await withSpinner('Loading...', () =>
          nuntly.webhooks.events.list({ cursor: opts.cursor, limit: opts.limit ? Number(opts.limit) : undefined }),
        );
        printResult({ data: page.data, nextCursor: page.nextCursor }, opts);
      }
    } catch (error) {
      printError(error, opts);
    }
  });

eventsSub
  .command('replay')
  .description(
    'Queues a new delivery of a past webhook event to the endpoint. The request is accepted asynchronously and returns 202 before the delivery runs.',
  )
  .argument('<id>', 'The id')
  .argument('<event-id>', 'The eventId')
  .option('--format <fmt>', 'Output format: json, raw, yaml, csv, markdown, table, quiet', parseFormat)
  .option('-q, --quiet', 'Shorthand for --format quiet')
  .option('--raw', 'Shorthand for --format raw')
  .option('--fields <fields>', 'Comma-separated list of fields to display')
  .option('--no-header', 'Omit column headers in table/csv output')
  .addHelpText(
    'after',
    '\nExample:\n  $ nuntly webhooks events replay wh_01ka8k8s80gvx9604cn9am5st4 evt_01ka8k8s80gvx9604cn9am5st4',
  )
  .action(async (id, eventId, opts, cmd) => {
    try {
      const { nuntly } = createNuntlyClient(cmd);
      const result = await withSpinner('Creating...', () => nuntly.webhooks.events.replay(id, eventId));
      printResult(result, opts);
    } catch (error) {
      printError(error, opts);
    }
  });

const eventsDeliveriesSub = new Command('deliveries');
eventsSub.addCommand(eventsDeliveriesSub);

eventsDeliveriesSub
  .command('list')
  .description(
    'Lists the delivery attempts of a webhook event to an endpoint, with the status, HTTP response code, response data, and delivery time of each attempt.',
  )
  .argument('<id>', 'The id')
  .argument('<event-id>', 'The eventId')
  .option('--format <fmt>', 'Output format: json, raw, yaml, csv, markdown, table, quiet', parseFormat)
  .option('-q, --quiet', 'Shorthand for --format quiet')
  .option('--raw', 'Shorthand for --format raw')
  .option('--fields <fields>', 'Comma-separated list of fields to display')
  .option('--no-header', 'Omit column headers in table/csv output')
  .addHelpText(
    'after',
    '\nExample:\n  $ nuntly webhooks events deliveries list wh_01ka8k8s80gvx9604cn9am5st4 evt_01ka8k8s80gvx9604cn9am5st4',
  )
  .action(async (id, eventId, opts, cmd) => {
    try {
      const { nuntly } = createNuntlyClient(cmd);
      const result = await withSpinner('Loading...', () => nuntly.webhooks.events.deliveries.list(id, eventId));
      printResult(result, opts);
    } catch (error) {
      printError(error, opts);
    }
  });

webhooksCommand
  .command('create')
  .description(
    'Registers an HTTPS endpoint to receive the event types you subscribe to. The response includes the signing secret used to verify webhook payloads.',
  )
  .option('--name <value>', 'The name of the webhook')
  .option('--endpoint-url <value>', 'The endpoint URL of the webhook (required)')
  .addOption(new Option('--status <value>', 'The status of the webhook.').choices(['enabled', 'disabled'] as const))
  .option(
    '--events <value>',
    'The event types to subscribe to (comma-separated, choices: email.sent, email.delivered, email.opened, email.clicked, email.bounced, email.complained, email.rejected, email.deliveryDelayed, email.failed, message.received, message.security.flagged, message.agent.triggered, message.sent, message.rejected) (required)',
    choiceList([
      'email.sent',
      'email.delivered',
      'email.opened',
      'email.clicked',
      'email.bounced',
      'email.complained',
      'email.rejected',
      'email.deliveryDelayed',
      'email.failed',
      'message.received',
      'message.security.flagged',
      'message.agent.triggered',
      'message.sent',
      'message.rejected',
    ]),
  )
  .option('--file <path>', 'Read JSON body from file (use - for stdin)')
  .option('--format <fmt>', 'Output format: json, raw, yaml, csv, markdown, table, quiet', parseFormat)
  .option('-q, --quiet', 'Shorthand for --format quiet')
  .option('--raw', 'Shorthand for --format raw')
  .option('--fields <fields>', 'Comma-separated list of fields to display')
  .option('--no-header', 'Omit column headers in table/csv output')
  .addHelpText(
    'after',
    '\nExample:\n  $ nuntly webhooks create --name "Production webhook" --endpoint-url https://example.com/webhooks --events email.sent\n  $ cat payload.json | nuntly webhooks create --file -\n  $ nuntly webhooks create --file payload.json',
  )
  .action(async (opts, cmd) => {
    try {
      const { nuntly } = createNuntlyClient(cmd);
      const body = resolveBody(opts.file, {
        name: opts.name,
        endpointUrl: opts.endpointUrl,
        status: opts.status,
        events: opts.events,
      });
      const result = await withSpinner('Creating...', () => nuntly.webhooks.create(body as CreateWebhookRequest));
      printResult(result, opts);
    } catch (error) {
      printError(error, opts);
    }
  });

webhooksCommand
  .command('delete')
  .description(
    'Permanently deletes a webhook endpoint. Events are no longer delivered to its URL after deletion. This cannot be undone.',
  )
  .argument('<id>', 'The id')
  .option('--format <fmt>', 'Output format: json, raw, yaml, csv, markdown, table, quiet', parseFormat)
  .option('-q, --quiet', 'Shorthand for --format quiet')
  .option('--raw', 'Shorthand for --format raw')
  .option('--fields <fields>', 'Comma-separated list of fields to display')
  .option('--no-header', 'Omit column headers in table/csv output')
  .addHelpText('after', '\nExample:\n  $ nuntly webhooks delete wh_01ka8k8s80gvx9604cn9am5st4')
  .action(async (id, opts, cmd) => {
    try {
      const { nuntly, globals } = createNuntlyClient(cmd);
      if (!(await confirmAction('delete', 'webhook', id, !!globals.yes))) return;
      const result = await withSpinner('Deleting...', () => nuntly.webhooks.delete(id));
      printResult(result, opts);
    } catch (error) {
      printError(error, opts);
    }
  });

webhooksCommand
  .command('list')
  .description(
    'Lists the webhook endpoints of your organization, newest first, with cursor pagination. Each entry shows its URL, event types, and status.',
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
    "\nExample:\n  $ nuntly webhooks list\n  $ nuntly webhooks list --format json | jq '.data[].id'",
  )
  .action(async (opts, cmd) => {
    try {
      const { nuntly } = createNuntlyClient(cmd);
      if (opts.all) {
        const page = await withSpinner('Loading...', () =>
          nuntly.webhooks.list({ cursor: opts.cursor, limit: opts.limit ? Number(opts.limit) : undefined }),
        );
        const all = [] as typeof page.data;
        for await (const item of page) all.push(item);
        printResult({ data: all, nextCursor: null }, opts);
      } else {
        const page = await withSpinner('Loading...', () =>
          nuntly.webhooks.list({ cursor: opts.cursor, limit: opts.limit ? Number(opts.limit) : undefined }),
        );
        printResult({ data: page.data, nextCursor: page.nextCursor }, opts);
      }
    } catch (error) {
      printError(error, opts);
    }
  });

webhooksCommand
  .command('retrieve')
  .description(
    'Retrieves a webhook endpoint with its URL, subscribed event types, status, and the reason and time it was disabled, if it is disabled.',
  )
  .argument('<id>', 'The id')
  .option('--format <fmt>', 'Output format: json, raw, yaml, csv, markdown, table, quiet', parseFormat)
  .option('-q, --quiet', 'Shorthand for --format quiet')
  .option('--raw', 'Shorthand for --format raw')
  .option('--fields <fields>', 'Comma-separated list of fields to display')
  .option('--no-header', 'Omit column headers in table/csv output')
  .addHelpText('after', '\nExample:\n  $ nuntly webhooks retrieve wh_01ka8k8s80gvx9604cn9am5st4')
  .action(async (id, opts, cmd) => {
    try {
      const { nuntly } = createNuntlyClient(cmd);
      const result = await withSpinner('Loading...', () => nuntly.webhooks.retrieve(id));
      printResult(result, opts);
    } catch (error) {
      printError(error, opts);
    }
  });

webhooksCommand
  .command('update')
  .description(
    'Updates the name, URL, event types, or status of a webhook, or rotates its signing secret. The new secret is returned only when you rotate it.',
  )
  .argument('<id>', 'The id')
  .option('--name <value>', 'The name of the webhook')
  .option('--endpoint-url <value>', 'The endpoint URL of the webhook')
  .option(
    '--events <value>',
    'The event types to subscribe to (comma-separated, choices: email.sent, email.delivered, email.opened, email.clicked, email.bounced, email.complained, email.rejected, email.deliveryDelayed, email.failed, message.received, message.security.flagged, message.agent.triggered, message.sent, message.rejected)',
    choiceList([
      'email.sent',
      'email.delivered',
      'email.opened',
      'email.clicked',
      'email.bounced',
      'email.complained',
      'email.rejected',
      'email.deliveryDelayed',
      'email.failed',
      'message.received',
      'message.security.flagged',
      'message.agent.triggered',
      'message.sent',
      'message.rejected',
    ]),
  )
  .addOption(new Option('--status <value>', 'The status of the webhook.').choices(['enabled', 'disabled'] as const))
  .option('--rotate-secret', 'If true, a new signing secret will be generated')
  .option('--no-rotate-secret', 'Send false for --rotate-secret')
  .option('--file <path>', 'Read JSON body from file (use - for stdin)')
  .option('--format <fmt>', 'Output format: json, raw, yaml, csv, markdown, table, quiet', parseFormat)
  .option('-q, --quiet', 'Shorthand for --format quiet')
  .option('--raw', 'Shorthand for --format raw')
  .option('--fields <fields>', 'Comma-separated list of fields to display')
  .option('--no-header', 'Omit column headers in table/csv output')
  .addHelpText(
    'after',
    '\nExample:\n  $ nuntly webhooks update wh_01ka8k8s80gvx9604cn9am5st4 --name "Production webhook" --events email.sent\n  $ cat payload.json | nuntly webhooks update wh_01ka8k8s80gvx9604cn9am5st4 --file -\n  $ nuntly webhooks update wh_01ka8k8s80gvx9604cn9am5st4 --file payload.json',
  )
  .action(async (id, opts, cmd) => {
    try {
      const { nuntly } = createNuntlyClient(cmd);
      const body = resolveBody(opts.file, {
        name: opts.name,
        endpointUrl: opts.endpointUrl,
        events: opts.events,
        status: opts.status,
        rotateSecret: opts.rotateSecret,
      });
      const result = await withSpinner('Updating...', () => nuntly.webhooks.update(id, body as UpdateWebhookRequest));
      printResult(result, opts);
    } catch (error) {
      printError(error, opts);
    }
  });
