import { Command, Option } from '@commander-js/extra-typings';
import type { CreateBroadcastRequest, SendBroadcastRequest, UpdateBroadcastRequest } from '@nuntly/sdk';
import { confirmAction, createNuntlyClient } from '../auth.js';
import { resolveBody } from '../files.js';
import { parseFormat, printError, printResult } from '../output.js';
import { withSpinner } from '../spinner.js';
import { listOrNull, nullable } from '../values.js';

export const broadcastsCommand = new Command('broadcasts').description('Broadcasts resource.');

const recipientsSub = new Command('recipients');
broadcastsCommand.addCommand(recipientsSub);

recipientsSub
  .command('list')
  .description('List the recipients of a broadcast.')
  .argument('<broadcast-id>', 'The broadcastId')
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
    "\nExample:\n  $ nuntly broadcasts recipients list bc_01kabn43yqyxn2bx4ve84mczd3\n  $ nuntly broadcasts recipients list bc_01kabn43yqyxn2bx4ve84mczd3 --format json | jq '.data[].id'",
  )
  .action(async (broadcastId, opts, cmd) => {
    try {
      const { nuntly } = createNuntlyClient(cmd);
      if (opts.all) {
        const page = await withSpinner('Loading...', () =>
          nuntly.broadcasts.recipients.list(broadcastId, {
            cursor: opts.cursor,
            limit: opts.limit ? Number(opts.limit) : undefined,
          }),
        );
        const all = [] as typeof page.data;
        for await (const item of page) all.push(item);
        printResult({ data: all, nextCursor: null }, opts);
      } else {
        const page = await withSpinner('Loading...', () =>
          nuntly.broadcasts.recipients.list(broadcastId, {
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

broadcastsCommand
  .command('create')
  .description('Create a broadcast for your contacts.')
  .option('--template-id <value>', 'The template to send.')
  .option('--from <value>', 'The sender address, on a verified domain. (required)')
  .option('--name <value>', 'An internal label, shown only to your team.')
  .option('--subject <value>', 'The subject. Defaults to the template version’s subject.')
  .option(
    '--reply-to <value>',
    "The email address where replies should be sent. If a recipient replies, the response will go to this address instead of the sender's email address (repeatable)",
    (value: string, acc: string[] = []) => acc.concat(value),
    [] as string[],
  )
  .option('--topic-id <value>', 'The topic to send to.')
  .option('--segment-id <value>', 'The segment to send to.')
  .option('--variables <value>', 'Variable values keyed by declared name.')
  .option('--file <path>', 'Read JSON body from file (use - for stdin)')
  .option('--idempotency-key <key>', 'Idempotency-Key header (auto-generated when omitted)')
  .option('--format <fmt>', 'Output format: json, raw, yaml, csv, markdown, table, quiet', parseFormat)
  .option('-q, --quiet', 'Shorthand for --format quiet')
  .option('--raw', 'Shorthand for --format raw')
  .option('--fields <fields>', 'Comma-separated list of fields to display')
  .option('--no-header', 'Omit column headers in table/csv output')
  .addHelpText(
    'after',
    '\nExample:\n  $ nuntly broadcasts create --from "Tomlinson AI <ray@info.tomlinson.ai>" --name "October newsletter"\n  $ cat payload.json | nuntly broadcasts create --file -\n  $ nuntly broadcasts create --file payload.json',
  )
  .action(async (opts, cmd) => {
    try {
      const { nuntly } = createNuntlyClient(cmd);
      const body = resolveBody(opts.file, {
        templateId: opts.templateId,
        from: opts.from,
        name: opts.name,
        subject: opts.subject,
        replyTo: (opts.replyTo as string[] | undefined)?.length ? (opts.replyTo as string[]) : undefined,
        topicId: opts.topicId,
        segmentId: opts.segmentId,
        variables: opts.variables != null ? JSON.parse(opts.variables as string) : undefined,
      });
      const result = await withSpinner('Creating...', () =>
        nuntly.broadcasts.create(
          body as CreateBroadcastRequest,
          opts.idempotencyKey ? { idempotencyKey: opts.idempotencyKey as string } : undefined,
        ),
      );
      printResult(result, opts);
    } catch (error) {
      printError(error, opts);
    }
  });

broadcastsCommand
  .command('delete')
  .description('Delete a draft, scheduled, or failed broadcast.')
  .argument('<broadcast-id>', 'The broadcastId')
  .option('--format <fmt>', 'Output format: json, raw, yaml, csv, markdown, table, quiet', parseFormat)
  .option('-q, --quiet', 'Shorthand for --format quiet')
  .option('--raw', 'Shorthand for --format raw')
  .option('--fields <fields>', 'Comma-separated list of fields to display')
  .option('--no-header', 'Omit column headers in table/csv output')
  .addHelpText('after', '\nExample:\n  $ nuntly broadcasts delete bc_01kabn43yqyxn2bx4ve84mczd3')
  .action(async (broadcastId, opts, cmd) => {
    try {
      const { nuntly, globals } = createNuntlyClient(cmd);
      if (!(await confirmAction('delete', 'broadcast', broadcastId, !!globals.yes))) return;
      const result = await withSpinner('Deleting...', () => nuntly.broadcasts.delete(broadcastId));
      printResult(result, opts);
    } catch (error) {
      printError(error, opts);
    }
  });

broadcastsCommand
  .command('list')
  .description('List the organization broadcasts.')
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
    "\nExample:\n  $ nuntly broadcasts list\n  $ nuntly broadcasts list --format json | jq '.data[].id'",
  )
  .action(async (opts, cmd) => {
    try {
      const { nuntly } = createNuntlyClient(cmd);
      if (opts.all) {
        const page = await withSpinner('Loading...', () =>
          nuntly.broadcasts.list({ cursor: opts.cursor, limit: opts.limit ? Number(opts.limit) : undefined }),
        );
        const all = [] as typeof page.data;
        for await (const item of page) all.push(item);
        printResult({ data: all, nextCursor: null }, opts);
      } else {
        const page = await withSpinner('Loading...', () =>
          nuntly.broadcasts.list({ cursor: opts.cursor, limit: opts.limit ? Number(opts.limit) : undefined }),
        );
        printResult({ data: page.data, nextCursor: page.nextCursor }, opts);
      }
    } catch (error) {
      printError(error, opts);
    }
  });

broadcastsCommand
  .command('retrieve')
  .description('Retrieve a broadcast and its status.')
  .argument('<broadcast-id>', 'The broadcastId')
  .option('--format <fmt>', 'Output format: json, raw, yaml, csv, markdown, table, quiet', parseFormat)
  .option('-q, --quiet', 'Shorthand for --format quiet')
  .option('--raw', 'Shorthand for --format raw')
  .option('--fields <fields>', 'Comma-separated list of fields to display')
  .option('--no-header', 'Omit column headers in table/csv output')
  .addHelpText('after', '\nExample:\n  $ nuntly broadcasts retrieve bc_01kabn43yqyxn2bx4ve84mczd3')
  .action(async (broadcastId, opts, cmd) => {
    try {
      const { nuntly } = createNuntlyClient(cmd);
      const result = await withSpinner('Loading...', () => nuntly.broadcasts.retrieve(broadcastId));
      printResult(result, opts);
    } catch (error) {
      printError(error, opts);
    }
  });

broadcastsCommand
  .command('send')
  .description('Send a broadcast now or schedule it.')
  .argument('<broadcast-id>', 'The broadcastId')
  .option('--scheduled-at <value>', 'When to send. Omit to send immediately.')
  .option('--file <path>', 'Read JSON body from file (use - for stdin)')
  .option('--idempotency-key <key>', 'Idempotency-Key header (auto-generated when omitted)')
  .option('--format <fmt>', 'Output format: json, raw, yaml, csv, markdown, table, quiet', parseFormat)
  .option('-q, --quiet', 'Shorthand for --format quiet')
  .option('--raw', 'Shorthand for --format raw')
  .option('--fields <fields>', 'Comma-separated list of fields to display')
  .option('--no-header', 'Omit column headers in table/csv output')
  .addHelpText(
    'after',
    '\nExample:\n  $ nuntly broadcasts send bc_01kabn43yqyxn2bx4ve84mczd3 --scheduled-at 2026-03-30T09:00:00.000Z\n  $ cat payload.json | nuntly --yes broadcasts send bc_01kabn43yqyxn2bx4ve84mczd3 --file -\n  $ nuntly broadcasts send bc_01kabn43yqyxn2bx4ve84mczd3 --file payload.json',
  )
  .action(async (broadcastId, opts, cmd) => {
    try {
      const { nuntly, globals } = createNuntlyClient(cmd);
      if (!(await confirmAction('send', 'broadcast', broadcastId, !!globals.yes))) return;
      const body = resolveBody(opts.file, {
        scheduledAt: opts.scheduledAt,
      });
      const result = await withSpinner('Creating...', () =>
        nuntly.broadcasts.send(
          broadcastId,
          body as SendBroadcastRequest,
          opts.idempotencyKey ? { idempotencyKey: opts.idempotencyKey as string } : undefined,
        ),
      );
      printResult(result, opts);
    } catch (error) {
      printError(error, opts);
    }
  });

broadcastsCommand
  .command('update')
  .description('Edit a draft or scheduled broadcast.')
  .argument('<broadcast-id>', 'The broadcastId')
  .option('--template-id <value>', 'Set to null to detach the template.')
  .option('--from <value>', 'The sender address, on a verified domain.')
  .option('--name <value>', 'Set to null to remove the name.')
  .option('--subject <value>', 'Set to null to fall back to the template version’s subject.')
  .option(
    '--reply-to <value>',
    "The email address where replies should be sent. If a recipient replies, the response will go to this address instead of the sender's email address (repeatable) (null to clear)",
    (value: string, acc: string[] = []) => acc.concat(value),
    [] as string[],
  )
  .option('--topic-id <value>', 'Set to null to remove the topic.')
  .option('--segment-id <value>', 'Set to null to remove the segment.')
  .option('--variables <value>', 'Replaces the stored values. Send {} to clear them.')
  .addOption(
    new Option('--status <value>', 'Only draft is accepted.').choices([
      'draft',
      'scheduled',
      'queued',
      'sending',
      'sent',
      'paused',
      'failed',
    ] as const),
  )
  .option('--file <path>', 'Read JSON body from file (use - for stdin)')
  .option('--format <fmt>', 'Output format: json, raw, yaml, csv, markdown, table, quiet', parseFormat)
  .option('-q, --quiet', 'Shorthand for --format quiet')
  .option('--raw', 'Shorthand for --format raw')
  .option('--fields <fields>', 'Comma-separated list of fields to display')
  .option('--no-header', 'Omit column headers in table/csv output')
  .addHelpText(
    'after',
    '\nExample:\n  $ nuntly broadcasts update bc_01kabn43yqyxn2bx4ve84mczd3 --name "October newsletter"\n  $ cat payload.json | nuntly broadcasts update bc_01kabn43yqyxn2bx4ve84mczd3 --file -\n  $ nuntly broadcasts update bc_01kabn43yqyxn2bx4ve84mczd3 --file payload.json',
  )
  .action(async (broadcastId, opts, cmd) => {
    try {
      const { nuntly } = createNuntlyClient(cmd);
      const body = resolveBody(opts.file, {
        templateId: nullable(opts.templateId),
        from: opts.from,
        name: nullable(opts.name),
        subject: nullable(opts.subject),
        replyTo: listOrNull(opts.replyTo),
        topicId: nullable(opts.topicId),
        segmentId: nullable(opts.segmentId),
        variables: opts.variables != null ? JSON.parse(opts.variables as string) : undefined,
        status: opts.status,
      });
      const result = await withSpinner('Updating...', () =>
        nuntly.broadcasts.update(broadcastId, body as UpdateBroadcastRequest),
      );
      printResult(result, opts);
    } catch (error) {
      printError(error, opts);
    }
  });
