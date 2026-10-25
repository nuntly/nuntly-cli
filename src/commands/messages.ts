import { Command } from '@commander-js/extra-typings';
import type { ForwardMessageRequest, ReplyMessageRequest, UpdateMessageRequest } from '@nuntly/sdk';
import { confirmAction, createNuntlyClient } from '../auth.js';
import { resolveBody } from '../files.js';
import { parseFormat, printError, printResult } from '../output.js';
import { withSpinner } from '../spinner.js';
import { choiceList } from '../values.js';

export const messagesCommand = new Command('messages').description('Messages resource.');

const attachmentsSub = new Command('attachments');
messagesCommand.addCommand(attachmentsSub);

attachmentsSub
  .command('list')
  .description(
    'Lists the attachments of a message with their filename, content type, size, disposition and content id. Download links are not included.',
  )
  .argument('<message-id>', 'The messageId')
  .option('--format <fmt>', 'Output format: json, raw, yaml, csv, markdown, table, quiet', parseFormat)
  .option('-q, --quiet', 'Shorthand for --format quiet')
  .option('--raw', 'Shorthand for --format raw')
  .option('--fields <fields>', 'Comma-separated list of fields to display')
  .option('--no-header', 'Omit column headers in table/csv output')
  .addHelpText('after', '\nExample:\n  $ nuntly messages attachments list imsg_01kabn43yqyxn2bx4ve84mczd3')
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
  .description(
    'Retrieves the metadata of an attachment and a temporary download URL that expires after 15 minutes. Use it to fetch the attachment file itself.',
  )
  .argument('<message-id>', 'The messageId')
  .argument('<attachment-id>', 'The attachmentId')
  .option('--format <fmt>', 'Output format: json, raw, yaml, csv, markdown, table, quiet', parseFormat)
  .option('-q, --quiet', 'Shorthand for --format quiet')
  .option('--raw', 'Shorthand for --format raw')
  .option('--fields <fields>', 'Comma-separated list of fields to display')
  .option('--no-header', 'Omit column headers in table/csv output')
  .addHelpText(
    'after',
    '\nExample:\n  $ nuntly messages attachments retrieve imsg_01kabn43yqyxn2bx4ve84mczd3 iatt_01kabn43yqyxn2bx4ve84mczd3',
  )
  .action(async (messageId, attachmentId, opts, cmd) => {
    try {
      const { nuntly } = createNuntlyClient(cmd);
      const result = await withSpinner('Loading...', () =>
        nuntly.messages.attachments.retrieve(messageId, attachmentId),
      );
      printResult(result, opts);
    } catch (error) {
      printError(error, opts);
    }
  });

const contentSub = new Command('content');
messagesCommand.addCommand(contentSub);

contentSub
  .command('retrieve')
  .description(
    'Returns temporary download URLs, valid for 2 minutes, for the HTML, plain-text or raw MIME content of a message. Only HTML is returned by default.',
  )
  .argument('<message-id>', 'The messageId')
  .option(
    '--content-format <value>',
    'Content formats to retrieve. Defaults to `html` only. (comma-separated, choices: html, text, mime)',
    choiceList(['html', 'text', 'mime']),
  )
  .option('--format <fmt>', 'Output format: json, raw, yaml, csv, markdown, table, quiet', parseFormat)
  .option('-q, --quiet', 'Shorthand for --format quiet')
  .option('--raw', 'Shorthand for --format raw')
  .option('--fields <fields>', 'Comma-separated list of fields to display')
  .option('--no-header', 'Omit column headers in table/csv output')
  .addHelpText('after', '\nExample:\n  $ nuntly messages content retrieve imsg_01kabn43yqyxn2bx4ve84mczd3')
  .action(async (messageId, opts, cmd) => {
    try {
      const { nuntly } = createNuntlyClient(cmd);
      const result = await withSpinner('Loading...', () =>
        nuntly.messages.content.retrieve(messageId, {
          format: opts.contentFormat as Array<'html' | 'text' | 'mime'> | undefined,
        }),
      );
      printResult(result, opts);
    } catch (error) {
      printError(error, opts);
    }
  });

messagesCommand
  .command('forward')
  .description(
    'Sends a message with a Fwd: subject from the inbox of the original message to one or more new recipients, in a new thread, with an optional text note.',
  )
  .argument('<message-id>', 'The messageId')
  .option(
    '--to <value>',
    'The recipient addresses to forward to. (repeatable) (required)',
    (value: string, acc: string[] = []) => acc.concat(value),
    [] as string[],
  )
  .option('--text <value>', 'An optional comment to prepend.')
  .option('--file <path>', 'Read JSON body from file (use - for stdin)')
  .option('--idempotency-key <key>', 'Idempotency-Key header (auto-generated when omitted)')
  .option('--format <fmt>', 'Output format: json, raw, yaml, csv, markdown, table, quiet', parseFormat)
  .option('-q, --quiet', 'Shorthand for --format quiet')
  .option('--raw', 'Shorthand for --format raw')
  .option('--fields <fields>', 'Comma-separated list of fields to display')
  .option('--no-header', 'Omit column headers in table/csv output')
  .addHelpText(
    'after',
    "\nExample:\n  $ nuntly messages forward imsg_01kabn43yqyxn2bx4ve84mczd3 --to brian67@gmail.com --text 'Thank you for signing up! Please verify your email address.'\n  $ cat payload.json | nuntly messages forward imsg_01kabn43yqyxn2bx4ve84mczd3 --file -\n  $ nuntly messages forward imsg_01kabn43yqyxn2bx4ve84mczd3 --file payload.json",
  )
  .action(async (messageId, opts, cmd) => {
    try {
      const { nuntly } = createNuntlyClient(cmd);
      const body = resolveBody(opts.file, {
        to: (opts.to as string[] | undefined)?.length ? (opts.to as string[]) : undefined,
        text: opts.text,
      });
      const result = await withSpinner('Creating...', () =>
        nuntly.messages.forward(
          messageId,
          body as ForwardMessageRequest,
          opts.idempotencyKey ? { idempotencyKey: opts.idempotencyKey as string } : undefined,
        ),
      );
      printResult(result, opts);
    } catch (error) {
      printError(error, opts);
    }
  });

messagesCommand
  .command('list')
  .description(
    'Lists messages newest first, with cursor pagination and optional filters by domain and sender. Each item includes its labels, status and attachment count.',
  )
  .option('--cursor <cursor>', 'Pagination cursor')
  .option('--limit <limit>', 'The maximum number of results to return, from 1 to 30. Defaults to 30.')
  .option('--domain-id <value>', 'Filter by domain.')
  .option('--from <value>', 'Filter by sender address.')
  .option('--all', 'Fetch all pages (auto-paginate)')
  .option('--format <fmt>', 'Output format: json, raw, yaml, csv, markdown, table, quiet', parseFormat)
  .option('-q, --quiet', 'Shorthand for --format quiet')
  .option('--raw', 'Shorthand for --format raw')
  .option('--fields <fields>', 'Comma-separated list of fields to display')
  .option('--no-header', 'Omit column headers in table/csv output')
  .addHelpText(
    'after',
    "\nExample:\n  $ nuntly messages list\n  $ nuntly messages list --format json | jq '.data[].id'",
  )
  .action(async (opts, cmd) => {
    try {
      const { nuntly } = createNuntlyClient(cmd);
      if (opts.all) {
        const page = await withSpinner('Loading...', () =>
          nuntly.messages.list({
            cursor: opts.cursor,
            limit: opts.limit ? Number(opts.limit) : undefined,
            domainId: opts.domainId,
            from: opts.from,
          }),
        );
        const all = [] as typeof page.data;
        for await (const item of page) all.push(item);
        printResult({ data: all, nextCursor: null }, opts);
      } else {
        const page = await withSpinner('Loading...', () =>
          nuntly.messages.list({
            cursor: opts.cursor,
            limit: opts.limit ? Number(opts.limit) : undefined,
            domainId: opts.domainId,
            from: opts.from,
          }),
        );
        printResult({ data: page.data, nextCursor: page.nextCursor }, opts);
      }
    } catch (error) {
      printError(error, opts);
    }
  });

messagesCommand
  .command('reply')
  .description(
    'Replies from the inbox that holds the message, in the same thread. Set replyAll to true to also copy the other recipients. The send is queued.',
  )
  .argument('<message-id>', 'The messageId')
  .option('--text <value>', 'The plain text body.')
  .option('--html <value>', 'The HTML body.')
  .option('--reply-all', 'Whether to reply to all recipients.')
  .option('--no-reply-all', 'Send false for --reply-all')
  .option('--file <path>', 'Read JSON body from file (use - for stdin)')
  .option('--idempotency-key <key>', 'Idempotency-Key header (auto-generated when omitted)')
  .option('--format <fmt>', 'Output format: json, raw, yaml, csv, markdown, table, quiet', parseFormat)
  .option('-q, --quiet', 'Shorthand for --format quiet')
  .option('--raw', 'Shorthand for --format raw')
  .option('--fields <fields>', 'Comma-separated list of fields to display')
  .option('--no-header', 'Omit column headers in table/csv output')
  .addHelpText(
    'after',
    "\nExample:\n  $ nuntly messages reply imsg_01kabn43yqyxn2bx4ve84mczd3 --text 'Thank you for signing up! Please verify your email address.' --html '<h1>Welcome</h1><p>Thank you for signing up! Please verify your email address.</p>'\n  $ cat payload.json | nuntly messages reply imsg_01kabn43yqyxn2bx4ve84mczd3 --file -\n  $ nuntly messages reply imsg_01kabn43yqyxn2bx4ve84mczd3 --file payload.json",
  )
  .action(async (messageId, opts, cmd) => {
    try {
      const { nuntly } = createNuntlyClient(cmd);
      const body = resolveBody(opts.file, {
        text: opts.text,
        html: opts.html,
        replyAll: opts.replyAll,
      });
      const result = await withSpinner('Creating...', () =>
        nuntly.messages.reply(
          messageId,
          body as ReplyMessageRequest,
          opts.idempotencyKey ? { idempotencyKey: opts.idempotencyKey as string } : undefined,
        ),
      );
      printResult(result, opts);
    } catch (error) {
      printError(error, opts);
    }
  });

messagesCommand
  .command('retrieve')
  .description(
    'Retrieves a received or sent message by id, including its sender, recipients, subject, labels, status, attachment count and raw headers.',
  )
  .argument('<message-id>', 'The messageId')
  .option('--format <fmt>', 'Output format: json, raw, yaml, csv, markdown, table, quiet', parseFormat)
  .option('-q, --quiet', 'Shorthand for --format quiet')
  .option('--raw', 'Shorthand for --format raw')
  .option('--fields <fields>', 'Comma-separated list of fields to display')
  .option('--no-header', 'Omit column headers in table/csv output')
  .addHelpText('after', '\nExample:\n  $ nuntly messages retrieve imsg_01kabn43yqyxn2bx4ve84mczd3')
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
  .description(
    'Adds or removes labels on a message. Only messages in user-created inboxes accept labels, and a message can hold at most 10 labels.',
  )
  .argument('<message-id>', 'The messageId')
  .option(
    '--add-labels <value>',
    'Labels to add to the message. (repeatable)',
    (value: string, acc: string[] = []) => acc.concat(value),
    [] as string[],
  )
  .option(
    '--remove-labels <value>',
    'Labels to remove from the message. (repeatable)',
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
    '\nExample:\n  $ nuntly messages update imsg_01kabn43yqyxn2bx4ve84mczd3 --add-labels urgent\n  $ cat payload.json | nuntly messages update imsg_01kabn43yqyxn2bx4ve84mczd3 --file -\n  $ nuntly messages update imsg_01kabn43yqyxn2bx4ve84mczd3 --file payload.json',
  )
  .action(async (messageId, opts, cmd) => {
    try {
      const { nuntly } = createNuntlyClient(cmd);
      const body = resolveBody(opts.file, {
        addLabels: (opts.addLabels as string[] | undefined)?.length ? (opts.addLabels as string[]) : undefined,
        removeLabels: (opts.removeLabels as string[] | undefined)?.length ? (opts.removeLabels as string[]) : undefined,
      });
      const result = await withSpinner('Updating...', () =>
        nuntly.messages.update(messageId, body as UpdateMessageRequest),
      );
      printResult(result, opts);
    } catch (error) {
      printError(error, opts);
    }
  });
