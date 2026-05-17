import { Command } from '@commander-js/extra-typings';
import type { CreateInboxRequest, UpdateInboxRequest, SendMessageRequest } from '@nuntly/sdk';
import { createNuntlyClient, confirmDelete } from '../auth.js';
import { printResult, printError } from '../output.js';
import { withSpinner } from '../spinner.js';
import { readInput } from '../files.js';

export const inboxesCommand = new Command('inboxes')
  .description('Inboxes resource.');

const threadsSub = new Command('threads');
inboxesCommand.addCommand(threadsSub);

threadsSub
  .command('list')
  .description('List threads in an inbox.')
  .argument('<inbox-id>', 'The inboxId')
  .option('--cursor <cursor>', 'Pagination cursor')
  .option('--limit <limit>', 'Max items to return')
  .option('--labels <value>', 'Comma-separated labels to filter by (AND logic). Threads with spam/trash are excluded by default unless explicitly requested via ?labels=spam or ?labels=trash.')
  .option('--all', 'Fetch all pages (auto-paginate)')
  .option('--format <fmt>', 'Output format: json, raw, yaml, csv, markdown, table, quiet')
  .option('-q, --quiet', 'Shorthand for --format quiet')
  .option('--raw', 'Shorthand for --format raw')
  .option('--fields <fields>', 'Comma-separated list of fields to display')
  .option('--no-header', 'Omit column headers in table/csv output')
  .addHelpText('after', '\nExample:\n  $ nuntly inboxes threads list ib_7890qrst\n  $ nuntly inboxes threads list ib_7890qrst --format json | jq \'.data[].id\'')
  .action(async (inboxId, opts, cmd) => {
    try {
      const { nuntly } = createNuntlyClient(cmd);
      if (opts.all) {
        const page = await withSpinner('Loading...', () => nuntly.inboxes.threads.list(inboxId, { cursor: opts.cursor, limit: opts.limit ? Number(opts.limit) : undefined, labels: opts.labels }));
        const all = [] as typeof page.data;
        for await (const item of page) all.push(item);
        printResult({ data: all }, opts);
      } else {
        const page = await withSpinner('Loading...', () => nuntly.inboxes.threads.list(inboxId, { cursor: opts.cursor, limit: opts.limit ? Number(opts.limit) : undefined, labels: opts.labels }));
        printResult({ data: page.data, nextCursor: page.nextCursor }, opts);
      }
    } catch (error) {
      printError(error, opts);
    }
  });

const messagesSub = new Command('messages');
inboxesCommand.addCommand(messagesSub);

messagesSub
  .command('send')
  .description('Send a new message from an inbox.')
  .argument('<inbox-id>', 'The inboxId')
  .option('--to <value>', 'The recipient addresses. (repeatable) (required)', (value: string, acc: string[] = []) => acc.concat(value), [] as string[])
  .option('--cc <value>', 'The CC addresses. (repeatable)', (value: string, acc: string[] = []) => acc.concat(value), [] as string[])
  .option('--bcc <value>', 'The BCC addresses. (repeatable)', (value: string, acc: string[] = []) => acc.concat(value), [] as string[])
  .option('--subject <value>', 'The message subject. (required)')
  .option('--text <value>', 'The plain text body.')
  .option('--html <value>', 'The HTML body.')
  .option('--file <path>', 'Read JSON body from file (use - for stdin)')
  .option('--idempotency-key <key>', 'Idempotency-Key header (auto-generated when omitted)')
  .option('--format <fmt>', 'Output format: json, raw, yaml, csv, markdown, table, quiet')
  .option('-q, --quiet', 'Shorthand for --format quiet')
  .option('--raw', 'Shorthand for --format raw')
  .option('--fields <fields>', 'Comma-separated list of fields to display')
  .option('--no-header', 'Omit column headers in table/csv output')
  .addHelpText('after', '\nExample:\n  $ nuntly inboxes messages send ib_7890qrst --to user@example.com --subject "Welcome aboard"\n  $ cat payload.json | nuntly inboxes messages send ib_7890qrst\n  $ nuntly inboxes messages send ib_7890qrst --file payload.json')
  .action(async (inboxId, opts, cmd) => {
    try {
      const { nuntly } = createNuntlyClient(cmd);
      const body = opts.file ? readInput(opts.file) : !process.stdin.isTTY ? readInput('-') : {
        to: opts.to as string[],
        cc: (opts.cc as string[] | undefined)?.length ? (opts.cc as string[]) : undefined,
        bcc: (opts.bcc as string[] | undefined)?.length ? (opts.bcc as string[]) : undefined,
        subject: opts.subject,
        text: opts.text,
        html: opts.html
      };
      const result = await withSpinner('Creating...', () => nuntly.inboxes.messages.send(inboxId, body as SendMessageRequest, opts.idempotencyKey ? { idempotencyKey: opts.idempotencyKey as string } : undefined));
      printResult(result, opts);
    } catch (error) {
      printError(error, opts);
    }
  });

inboxesCommand
  .command('create')
  .description('Create a new inbox on a verified domain.')
  .option('--domain-id <value>', 'The id of the domain for this inbox. Defaults to your provided domain when omitted.')
  .option('--address <value>', 'The local-part of the email address (before the @). (required)')
  .option('--name <value>', 'The display name of the inbox.')
  .option('--namespace-id <value>', 'The id of the namespace to assign the inbox to.')
  .option('--agent-id <value>', 'The external AI agent identifier.')
  .option('--file <path>', 'Read JSON body from file (use - for stdin)')
  .option('--format <fmt>', 'Output format: json, raw, yaml, csv, markdown, table, quiet')
  .option('-q, --quiet', 'Shorthand for --format quiet')
  .option('--raw', 'Shorthand for --format raw')
  .option('--fields <fields>', 'Comma-separated list of fields to display')
  .option('--no-header', 'Omit column headers in table/csv output')
  .addHelpText('after', '\nExample:\n  $ nuntly inboxes create --address support\n  $ cat payload.json | nuntly inboxes create\n  $ nuntly inboxes create --file payload.json')
  .action(async (opts, cmd) => {
    try {
      const { nuntly } = createNuntlyClient(cmd);
      const body = opts.file ? readInput(opts.file) : !process.stdin.isTTY ? readInput('-') : {
        domainId: opts.domainId,
        address: opts.address,
        name: opts.name,
        namespaceId: opts.namespaceId,
        agentId: opts.agentId
      };
      const result = await withSpinner('Creating...', () => nuntly.inboxes.create(body as CreateInboxRequest));
      printResult(result, opts);
    } catch (error) {
      printError(error, opts);
    }
  });

inboxesCommand
  .command('delete')
  .description('Soft-delete an inbox.')
  .argument('<inbox-id>', 'The inboxId')
  .option('--format <fmt>', 'Output format: json, raw, yaml, csv, markdown, table, quiet')
  .option('-q, --quiet', 'Shorthand for --format quiet')
  .option('--raw', 'Shorthand for --format raw')
  .option('--fields <fields>', 'Comma-separated list of fields to display')
  .option('--no-header', 'Omit column headers in table/csv output')
  .addHelpText('after', '\nExample:\n  $ nuntly inboxes delete ib_7890qrst')
  .action(async (inboxId, opts, cmd) => {
    try {
      const { nuntly, globals } = createNuntlyClient(cmd);
      if (!await confirmDelete('inboxes', inboxId, !!globals.yes)) return;
      const result = await withSpinner('Deleting...', () => nuntly.inboxes.delete(inboxId));
      printResult(result, opts);
    } catch (error) {
      printError(error, opts);
    }
  });

inboxesCommand
  .command('list')
  .description('List all inboxes.')
  .option('--cursor <cursor>', 'Pagination cursor')
  .option('--limit <limit>', 'Max items to return')
  .option('--namespace-id <value>', 'Filter by namespace.')
  .option('--all', 'Fetch all pages (auto-paginate)')
  .option('--format <fmt>', 'Output format: json, raw, yaml, csv, markdown, table, quiet')
  .option('-q, --quiet', 'Shorthand for --format quiet')
  .option('--raw', 'Shorthand for --format raw')
  .option('--fields <fields>', 'Comma-separated list of fields to display')
  .option('--no-header', 'Omit column headers in table/csv output')
  .addHelpText('after', '\nExample:\n  $ nuntly inboxes list\n  $ nuntly inboxes list --format json | jq \'.data[].id\'')
  .action(async (opts, cmd) => {
    try {
      const { nuntly } = createNuntlyClient(cmd);
      if (opts.all) {
        const page = await withSpinner('Loading...', () => nuntly.inboxes.list({ cursor: opts.cursor, limit: opts.limit ? Number(opts.limit) : undefined, namespaceId: opts.namespaceId }));
        const all = [] as typeof page.data;
        for await (const item of page) all.push(item);
        printResult({ data: all }, opts);
      } else {
        const page = await withSpinner('Loading...', () => nuntly.inboxes.list({ cursor: opts.cursor, limit: opts.limit ? Number(opts.limit) : undefined, namespaceId: opts.namespaceId }));
        printResult({ data: page.data, nextCursor: page.nextCursor }, opts);
      }
    } catch (error) {
      printError(error, opts);
    }
  });

inboxesCommand
  .command('retrieve')
  .description('Retrieve an inbox.')
  .argument('<inbox-id>', 'The inboxId')
  .option('--format <fmt>', 'Output format: json, raw, yaml, csv, markdown, table, quiet')
  .option('-q, --quiet', 'Shorthand for --format quiet')
  .option('--raw', 'Shorthand for --format raw')
  .option('--fields <fields>', 'Comma-separated list of fields to display')
  .option('--no-header', 'Omit column headers in table/csv output')
  .addHelpText('after', '\nExample:\n  $ nuntly inboxes retrieve ib_7890qrst')
  .action(async (inboxId, opts, cmd) => {
    try {
      const { nuntly } = createNuntlyClient(cmd);
      const result = await withSpinner('Loading...', () => nuntly.inboxes.retrieve(inboxId));
      printResult(result, opts);
    } catch (error) {
      printError(error, opts);
    }
  });

inboxesCommand
  .command('update')
  .description('Update an inbox.')
  .argument('<inbox-id>', 'The inboxId')
  .option('--name <value>', 'The display name of the inbox.')
  .option('--file <path>', 'Read JSON body from file (use - for stdin)')
  .option('--format <fmt>', 'Output format: json, raw, yaml, csv, markdown, table, quiet')
  .option('-q, --quiet', 'Shorthand for --format quiet')
  .option('--raw', 'Shorthand for --format raw')
  .option('--fields <fields>', 'Comma-separated list of fields to display')
  .option('--no-header', 'Omit column headers in table/csv output')
  .addHelpText('after', '\nExample:\n  $ nuntly inboxes update ib_7890qrst --name my-resource\n  $ cat payload.json | nuntly inboxes update ib_7890qrst\n  $ nuntly inboxes update ib_7890qrst --file payload.json')
  .action(async (inboxId, opts, cmd) => {
    try {
      const { nuntly } = createNuntlyClient(cmd);
      const body = opts.file ? readInput(opts.file) : !process.stdin.isTTY ? readInput('-') : {
        name: opts.name
      };
      const result = await withSpinner('Updating...', () => nuntly.inboxes.update(inboxId, body as UpdateInboxRequest));
      printResult(result, opts);
    } catch (error) {
      printError(error, opts);
    }
  });

