import { Command } from '@commander-js/extra-typings';
import type { UpdateThreadRequest } from '@nuntly/sdk';
import { confirmAction, createNuntlyClient } from '../auth.js';
import { resolveBody } from '../files.js';
import { parseFormat, printError, printResult } from '../output.js';
import { withSpinner } from '../spinner.js';
import { nullable } from '../values.js';

export const threadsCommand = new Command('threads').description('Threads resource.');

const messagesSub = new Command('messages');
threadsCommand.addCommand(messagesSub);

messagesSub
  .command('list')
  .description(
    'Lists the messages in a thread in chronological order, oldest first, with cursor pagination. Returns up to 30 messages per page.',
  )
  .argument('<thread-id>', 'The threadId')
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
    "\nExample:\n  $ nuntly threads messages list thr_01kabn43yqyxn2bx4ve84mczd3\n  $ nuntly threads messages list thr_01kabn43yqyxn2bx4ve84mczd3 --format json | jq '.data[].id'",
  )
  .action(async (threadId, opts, cmd) => {
    try {
      const { nuntly } = createNuntlyClient(cmd);
      if (opts.all) {
        const page = await withSpinner('Loading...', () =>
          nuntly.threads.messages.list(threadId, {
            cursor: opts.cursor,
            limit: opts.limit ? Number(opts.limit) : undefined,
          }),
        );
        const all = [] as typeof page.data;
        for await (const item of page) all.push(item);
        printResult({ data: all, nextCursor: null }, opts);
      } else {
        const page = await withSpinner('Loading...', () =>
          nuntly.threads.messages.list(threadId, {
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

threadsCommand
  .command('retrieve')
  .description(
    'Retrieves a thread with its subject, message count, last activity and labels from all its messages. Pass markRead=true to clear unread labels.',
  )
  .argument('<thread-id>', 'The threadId')
  .option('--mark-read', 'Removes the unread label from all messages in the thread.')
  .option('--format <fmt>', 'Output format: json, raw, yaml, csv, markdown, table, quiet', parseFormat)
  .option('-q, --quiet', 'Shorthand for --format quiet')
  .option('--raw', 'Shorthand for --format raw')
  .option('--fields <fields>', 'Comma-separated list of fields to display')
  .option('--no-header', 'Omit column headers in table/csv output')
  .addHelpText('after', '\nExample:\n  $ nuntly threads retrieve thr_01kabn43yqyxn2bx4ve84mczd3')
  .action(async (threadId, opts, cmd) => {
    try {
      const { nuntly } = createNuntlyClient(cmd);
      const result = await withSpinner('Loading...', () =>
        nuntly.threads.retrieve(threadId, { markRead: opts.markRead ? 'true' : undefined }),
      );
      printResult(result, opts);
    } catch (error) {
      printError(error, opts);
    }
  });

threadsCommand
  .command('update')
  .description(
    'Adds or removes labels on every message in a thread, or sets its agent. Label operations only work on threads in user-created inboxes.',
  )
  .argument('<thread-id>', 'The threadId')
  .option(
    '--add-labels <value>',
    'Labels to add to all messages in the thread. (repeatable)',
    (value: string, acc: string[] = []) => acc.concat(value),
    [] as string[],
  )
  .option(
    '--remove-labels <value>',
    'Labels to remove from all messages in the thread. (repeatable)',
    (value: string, acc: string[] = []) => acc.concat(value),
    [] as string[],
  )
  .option('--agent-id <value>', 'The AI agent identifier. (null to clear)')
  .option('--file <path>', 'Read JSON body from file (use - for stdin)')
  .option('--format <fmt>', 'Output format: json, raw, yaml, csv, markdown, table, quiet', parseFormat)
  .option('-q, --quiet', 'Shorthand for --format quiet')
  .option('--raw', 'Shorthand for --format raw')
  .option('--fields <fields>', 'Comma-separated list of fields to display')
  .option('--no-header', 'Omit column headers in table/csv output')
  .addHelpText(
    'after',
    '\nExample:\n  $ nuntly threads update thr_01kabn43yqyxn2bx4ve84mczd3 --add-labels urgent\n  $ cat payload.json | nuntly threads update thr_01kabn43yqyxn2bx4ve84mczd3 --file -\n  $ nuntly threads update thr_01kabn43yqyxn2bx4ve84mczd3 --file payload.json',
  )
  .action(async (threadId, opts, cmd) => {
    try {
      const { nuntly } = createNuntlyClient(cmd);
      const body = resolveBody(opts.file, {
        addLabels: (opts.addLabels as string[] | undefined)?.length ? (opts.addLabels as string[]) : undefined,
        removeLabels: (opts.removeLabels as string[] | undefined)?.length ? (opts.removeLabels as string[]) : undefined,
        agentId: nullable(opts.agentId),
      });
      const result = await withSpinner('Updating...', () =>
        nuntly.threads.update(threadId, body as UpdateThreadRequest),
      );
      printResult(result, opts);
    } catch (error) {
      printError(error, opts);
    }
  });
