import { Command } from '@commander-js/extra-typings';
import type { CreateTopicRequest, UpdateTopicRequest } from '@nuntly/sdk';
import { confirmAction, createNuntlyClient } from '../auth.js';
import { resolveBody } from '../files.js';
import { parseFormat, printError, printResult } from '../output.js';
import { withSpinner } from '../spinner.js';

export const topicsCommand = new Command('topics').description('Topics resource.');

const membershipsSub = new Command('memberships');
topicsCommand.addCommand(membershipsSub);

membershipsSub
  .command('list')
  .description("List a topic's explicit membership records only. A contact without one is subscribed by default.")
  .argument('<topic-id>', 'The topicId')
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
    "\nExample:\n  $ nuntly topics memberships list tpc_01kabn43yqyxn2bx4ve84mczd3\n  $ nuntly topics memberships list tpc_01kabn43yqyxn2bx4ve84mczd3 --format json | jq '.data[].id'",
  )
  .action(async (topicId, opts, cmd) => {
    try {
      const { nuntly } = createNuntlyClient(cmd);
      if (opts.all) {
        const page = await withSpinner('Loading...', () =>
          nuntly.topics.memberships.list(topicId, {
            cursor: opts.cursor,
            limit: opts.limit ? Number(opts.limit) : undefined,
          }),
        );
        const all = [] as typeof page.data;
        for await (const item of page) all.push(item);
        printResult({ data: all, nextCursor: null }, opts);
      } else {
        const page = await withSpinner('Loading...', () =>
          nuntly.topics.memberships.list(topicId, {
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

topicsCommand
  .command('create')
  .description('Create a topic.')
  .option('--name <value>', 'A name for the topic, shown to your team. Stored lowercased and trimmed. (required)')
  .option('--file <path>', 'Read JSON body from file (use - for stdin)')
  .option('--format <fmt>', 'Output format: json, raw, yaml, csv, markdown, table, quiet', parseFormat)
  .option('-q, --quiet', 'Shorthand for --format quiet')
  .option('--raw', 'Shorthand for --format raw')
  .option('--fields <fields>', 'Comma-separated list of fields to display')
  .option('--no-header', 'Omit column headers in table/csv output')
  .addHelpText(
    'after',
    '\nExample:\n  $ nuntly topics create --name "product updates"\n  $ cat payload.json | nuntly topics create --file -\n  $ nuntly topics create --file payload.json',
  )
  .action(async (opts, cmd) => {
    try {
      const { nuntly } = createNuntlyClient(cmd);
      const body = resolveBody(opts.file, {
        name: opts.name,
      });
      const result = await withSpinner('Creating...', () => nuntly.topics.create(body as CreateTopicRequest));
      printResult(result, opts);
    } catch (error) {
      printError(error, opts);
    }
  });

topicsCommand
  .command('delete')
  .description('Delete a topic.')
  .argument('<topic-id>', 'The topicId')
  .option('--format <fmt>', 'Output format: json, raw, yaml, csv, markdown, table, quiet', parseFormat)
  .option('-q, --quiet', 'Shorthand for --format quiet')
  .option('--raw', 'Shorthand for --format raw')
  .option('--fields <fields>', 'Comma-separated list of fields to display')
  .option('--no-header', 'Omit column headers in table/csv output')
  .addHelpText('after', '\nExample:\n  $ nuntly topics delete tpc_01kabn43yqyxn2bx4ve84mczd3')
  .action(async (topicId, opts, cmd) => {
    try {
      const { nuntly, globals } = createNuntlyClient(cmd);
      if (!(await confirmAction('delete', 'topic', topicId, !!globals.yes))) return;
      const result = await withSpinner('Deleting...', () => nuntly.topics.delete(topicId));
      printResult(result, opts);
    } catch (error) {
      printError(error, opts);
    }
  });

topicsCommand
  .command('list')
  .description('List the organization topics.')
  .option('--cursor <cursor>', 'Pagination cursor')
  .option('--limit <limit>', 'The maximum number of results to return, from 1 to 30. Defaults to 30.')
  .option('--all', 'Fetch all pages (auto-paginate)')
  .option('--format <fmt>', 'Output format: json, raw, yaml, csv, markdown, table, quiet', parseFormat)
  .option('-q, --quiet', 'Shorthand for --format quiet')
  .option('--raw', 'Shorthand for --format raw')
  .option('--fields <fields>', 'Comma-separated list of fields to display')
  .option('--no-header', 'Omit column headers in table/csv output')
  .addHelpText('after', "\nExample:\n  $ nuntly topics list\n  $ nuntly topics list --format json | jq '.data[].id'")
  .action(async (opts, cmd) => {
    try {
      const { nuntly } = createNuntlyClient(cmd);
      if (opts.all) {
        const page = await withSpinner('Loading...', () =>
          nuntly.topics.list({ cursor: opts.cursor, limit: opts.limit ? Number(opts.limit) : undefined }),
        );
        const all = [] as typeof page.data;
        for await (const item of page) all.push(item);
        printResult({ data: all, nextCursor: null }, opts);
      } else {
        const page = await withSpinner('Loading...', () =>
          nuntly.topics.list({ cursor: opts.cursor, limit: opts.limit ? Number(opts.limit) : undefined }),
        );
        printResult({ data: page.data, nextCursor: page.nextCursor }, opts);
      }
    } catch (error) {
      printError(error, opts);
    }
  });

topicsCommand
  .command('retrieve')
  .description('Retrieve one topic.')
  .argument('<topic-id>', 'The topicId')
  .option('--format <fmt>', 'Output format: json, raw, yaml, csv, markdown, table, quiet', parseFormat)
  .option('-q, --quiet', 'Shorthand for --format quiet')
  .option('--raw', 'Shorthand for --format raw')
  .option('--fields <fields>', 'Comma-separated list of fields to display')
  .option('--no-header', 'Omit column headers in table/csv output')
  .addHelpText('after', '\nExample:\n  $ nuntly topics retrieve tpc_01kabn43yqyxn2bx4ve84mczd3')
  .action(async (topicId, opts, cmd) => {
    try {
      const { nuntly } = createNuntlyClient(cmd);
      const result = await withSpinner('Loading...', () => nuntly.topics.retrieve(topicId));
      printResult(result, opts);
    } catch (error) {
      printError(error, opts);
    }
  });

topicsCommand
  .command('update')
  .description('Rename a topic.')
  .argument('<topic-id>', 'The topicId')
  .option('--name <value>', 'A name for the topic, shown to your team. Stored lowercased and trimmed. (required)')
  .option('--file <path>', 'Read JSON body from file (use - for stdin)')
  .option('--format <fmt>', 'Output format: json, raw, yaml, csv, markdown, table, quiet', parseFormat)
  .option('-q, --quiet', 'Shorthand for --format quiet')
  .option('--raw', 'Shorthand for --format raw')
  .option('--fields <fields>', 'Comma-separated list of fields to display')
  .option('--no-header', 'Omit column headers in table/csv output')
  .addHelpText(
    'after',
    '\nExample:\n  $ nuntly topics update tpc_01kabn43yqyxn2bx4ve84mczd3 --name "product updates"\n  $ cat payload.json | nuntly topics update tpc_01kabn43yqyxn2bx4ve84mczd3 --file -\n  $ nuntly topics update tpc_01kabn43yqyxn2bx4ve84mczd3 --file payload.json',
  )
  .action(async (topicId, opts, cmd) => {
    try {
      const { nuntly } = createNuntlyClient(cmd);
      const body = resolveBody(opts.file, {
        name: opts.name,
      });
      const result = await withSpinner('Updating...', () => nuntly.topics.update(topicId, body as UpdateTopicRequest));
      printResult(result, opts);
    } catch (error) {
      printError(error, opts);
    }
  });
