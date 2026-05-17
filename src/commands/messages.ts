import { Command } from '@commander-js/extra-typings';
import type { ForwardMessageRequest, ReplyMessageRequest, UpdateMessageRequest } from '@nuntly/sdk';
import { createNuntlyClient, confirmDelete } from '../auth.js';
import { printResult, printError } from '../output.js';
import { withSpinner } from '../spinner.js';
import { readInput } from '../files.js';

export const messagesCommand = new Command('messages')
  .description('Messages resource.');

const attachmentsSub = new Command('attachments');
messagesCommand.addCommand(attachmentsSub);

attachmentsSub
  .command('list')
  .description('List all attachments for a message.')
  .argument('<message-id>', 'The messageId')
  .option('--format <fmt>', 'Output format: json, raw, yaml, csv, markdown, table, quiet')
  .option('-q, --quiet', 'Shorthand for --format quiet')
  .option('--raw', 'Shorthand for --format raw')
  .option('--fields <fields>', 'Comma-separated list of fields to display')
  .option('--no-header', 'Omit column headers in table/csv output')
  .addHelpText('after', '\nExample:\n  $ nuntly messages attachments list mg_4567ghij')
  .action(async (messageId, opts, cmd) => {
    try {
      const { nuntly } = createNuntlyClient(cmd);
      const result = await withSpinner('Loading...', () => nuntly.messages.attachments.list(messageId));
      printResult(result, opts);
    } catch (error) {
      printError(error, opts);
    }
  });

attachmentsSub
  .command('retrieve')
  .description('Retrieve an attachment with a presigned download URL.')
  .argument('<message-id>', 'The messageId')
  .argument('<attachment-id>', 'The attachmentId')
  .option('--format <fmt>', 'Output format: json, raw, yaml, csv, markdown, table, quiet')
  .option('-q, --quiet', 'Shorthand for --format quiet')
  .option('--raw', 'Shorthand for --format raw')
  .option('--fields <fields>', 'Comma-separated list of fields to display')
  .option('--no-header', 'Omit column headers in table/csv output')
  .addHelpText('after', '\nExample:\n  $ nuntly messages attachments retrieve mg_4567ghij mg_4567ghij')
  .action(async (messageId, attachmentId, opts, cmd) => {
    try {
      const { nuntly } = createNuntlyClient(cmd);
      const result = await withSpinner('Loading...', () => nuntly.messages.attachments.retrieve(messageId, attachmentId));
      printResult(result, opts);
    } catch (error) {
      printError(error, opts);
    }
  });

const contentSub = new Command('content');
messagesCommand.addCommand(contentSub);

contentSub
  .command('retrieve')
  .description('Returns presigned URLs to download the HTML, plain-text, and raw MIME source of a received message.')
  .argument('<message-id>', 'The messageId')
  .option('--format <fmt>', 'Output format: json, raw, yaml, csv, markdown, table, quiet')
  .option('-q, --quiet', 'Shorthand for --format quiet')
  .option('--raw', 'Shorthand for --format raw')
  .option('--fields <fields>', 'Comma-separated list of fields to display')
  .option('--no-header', 'Omit column headers in table/csv output')
  .addHelpText('after', '\nExample:\n  $ nuntly messages content retrieve mg_4567ghij')
  .action(async (messageId, opts, cmd) => {
    try {
      const { nuntly } = createNuntlyClient(cmd);
      const result = await withSpinner('Loading...', () => nuntly.messages.content.retrieve(messageId));
      printResult(result, opts);
    } catch (error) {
      printError(error, opts);
    }
  });

messagesCommand
  .command('forward')
  .description('Forward a message to new recipients.')
  .argument('<message-id>', 'The messageId')
  .option('--to <value>', 'The recipient addresses to forward to. (repeatable) (required)', (value: string, acc: string[] = []) => acc.concat(value), [] as string[])
  .option('--text <value>', 'An optional comment to prepend.')
  .option('--file <path>', 'Read JSON body from file (use - for stdin)')
  .option('--idempotency-key <key>', 'Idempotency-Key header (auto-generated when omitted)')
  .option('--format <fmt>', 'Output format: json, raw, yaml, csv, markdown, table, quiet')
  .option('-q, --quiet', 'Shorthand for --format quiet')
  .option('--raw', 'Shorthand for --format raw')
  .option('--fields <fields>', 'Comma-separated list of fields to display')
  .option('--no-header', 'Omit column headers in table/csv output')
  .addHelpText('after', '\nExample:\n  $ nuntly messages forward mg_4567ghij --to user@example.com\n  $ cat payload.json | nuntly messages forward mg_4567ghij\n  $ nuntly messages forward mg_4567ghij --file payload.json')
  .action(async (messageId, opts, cmd) => {
    try {
      const { nuntly } = createNuntlyClient(cmd);
      const body = opts.file ? readInput(opts.file) : !process.stdin.isTTY ? readInput('-') : {
        to: opts.to as string[],
        text: opts.text
      };
      const result = await withSpinner('Creating...', () => nuntly.messages.forward(messageId, body as ForwardMessageRequest, opts.idempotencyKey ? { idempotencyKey: opts.idempotencyKey as string } : undefined));
      printResult(result, opts);
    } catch (error) {
      printError(error, opts);
    }
  });

messagesCommand
  .command('list')
  .description('List all received messages across inboxes.')
  .option('--cursor <cursor>', 'Pagination cursor')
  .option('--limit <limit>', 'Max items to return')
  .option('--domain-id <value>', 'Filter by domain.')
  .option('--from <value>', 'Filter by sender address.')
  .option('--all', 'Fetch all pages (auto-paginate)')
  .option('--format <fmt>', 'Output format: json, raw, yaml, csv, markdown, table, quiet')
  .option('-q, --quiet', 'Shorthand for --format quiet')
  .option('--raw', 'Shorthand for --format raw')
  .option('--fields <fields>', 'Comma-separated list of fields to display')
  .option('--no-header', 'Omit column headers in table/csv output')
  .addHelpText('after', '\nExample:\n  $ nuntly messages list\n  $ nuntly messages list --format json | jq \'.data[].id\'')
  .action(async (opts, cmd) => {
    try {
      const { nuntly } = createNuntlyClient(cmd);
      if (opts.all) {
        const page = await withSpinner('Loading...', () => nuntly.messages.list({ cursor: opts.cursor, limit: opts.limit ? Number(opts.limit) : undefined, domainId: opts.domainId, from: opts.from }));
        const all = [] as typeof page.data;
        for await (const item of page) all.push(item);
        printResult({ data: all }, opts);
      } else {
        const page = await withSpinner('Loading...', () => nuntly.messages.list({ cursor: opts.cursor, limit: opts.limit ? Number(opts.limit) : undefined, domainId: opts.domainId, from: opts.from }));
        printResult({ data: page.data, nextCursor: page.nextCursor }, opts);
      }
    } catch (error) {
      printError(error, opts);
    }
  });

messagesCommand
  .command('reply')
  .description('Reply to a message. Set replyAll to true to reply to all recipients.')
  .argument('<message-id>', 'The messageId')
  .option('--text <value>', 'The plain text body.')
  .option('--html <value>', 'The HTML body.')
  .option('--reply-all', 'Whether to reply to all recipients. (required)')
  .option('--file <path>', 'Read JSON body from file (use - for stdin)')
  .option('--idempotency-key <key>', 'Idempotency-Key header (auto-generated when omitted)')
  .option('--format <fmt>', 'Output format: json, raw, yaml, csv, markdown, table, quiet')
  .option('-q, --quiet', 'Shorthand for --format quiet')
  .option('--raw', 'Shorthand for --format raw')
  .option('--fields <fields>', 'Comma-separated list of fields to display')
  .option('--no-header', 'Omit column headers in table/csv output')
  .addHelpText('after', '\nExample:\n  $ nuntly messages reply mg_4567ghij --reply-all\n  $ cat payload.json | nuntly messages reply mg_4567ghij\n  $ nuntly messages reply mg_4567ghij --file payload.json')
  .action(async (messageId, opts, cmd) => {
    try {
      const { nuntly } = createNuntlyClient(cmd);
      const body = opts.file ? readInput(opts.file) : !process.stdin.isTTY ? readInput('-') : {
        text: opts.text,
        html: opts.html,
        replyAll: opts.replyAll
      };
      const result = await withSpinner('Creating...', () => nuntly.messages.reply(messageId, body as ReplyMessageRequest, opts.idempotencyKey ? { idempotencyKey: opts.idempotencyKey as string } : undefined));
      printResult(result, opts);
    } catch (error) {
      printError(error, opts);
    }
  });

messagesCommand
  .command('retrieve')
  .description('Retrieve a single message with inbox enrichment.')
  .argument('<message-id>', 'The messageId')
  .option('--format <fmt>', 'Output format: json, raw, yaml, csv, markdown, table, quiet')
  .option('-q, --quiet', 'Shorthand for --format quiet')
  .option('--raw', 'Shorthand for --format raw')
  .option('--fields <fields>', 'Comma-separated list of fields to display')
  .option('--no-header', 'Omit column headers in table/csv output')
  .addHelpText('after', '\nExample:\n  $ nuntly messages retrieve mg_4567ghij')
  .action(async (messageId, opts, cmd) => {
    try {
      const { nuntly } = createNuntlyClient(cmd);
      const result = await withSpinner('Loading...', () => nuntly.messages.retrieve(messageId));
      printResult(result, opts);
    } catch (error) {
      printError(error, opts);
    }
  });

messagesCommand
  .command('update')
  .description('Update message labels. Only available for messages in user-created inboxes.')
  .argument('<message-id>', 'The messageId')
  .option('--add-labels <value>', 'Labels to add to the message. (repeatable)', (value: string, acc: string[] = []) => acc.concat(value), [] as string[])
  .option('--remove-labels <value>', 'Labels to remove from the message. (repeatable)', (value: string, acc: string[] = []) => acc.concat(value), [] as string[])
  .option('--file <path>', 'Read JSON body from file (use - for stdin)')
  .option('--format <fmt>', 'Output format: json, raw, yaml, csv, markdown, table, quiet')
  .option('-q, --quiet', 'Shorthand for --format quiet')
  .option('--raw', 'Shorthand for --format raw')
  .option('--fields <fields>', 'Comma-separated list of fields to display')
  .option('--no-header', 'Omit column headers in table/csv output')
  .addHelpText('after', '\nExample:\n  $ nuntly messages update mg_4567ghij --add-labels spam,reviewed\n  $ cat payload.json | nuntly messages update mg_4567ghij\n  $ nuntly messages update mg_4567ghij --file payload.json')
  .action(async (messageId, opts, cmd) => {
    try {
      const { nuntly } = createNuntlyClient(cmd);
      const body = opts.file ? readInput(opts.file) : !process.stdin.isTTY ? readInput('-') : {
        addLabels: (opts.addLabels as string[] | undefined)?.length ? (opts.addLabels as string[]) : undefined,
        removeLabels: (opts.removeLabels as string[] | undefined)?.length ? (opts.removeLabels as string[]) : undefined
      };
      const result = await withSpinner('Updating...', () => nuntly.messages.update(messageId, body as UpdateMessageRequest));
      printResult(result, opts);
    } catch (error) {
      printError(error, opts);
    }
  });

