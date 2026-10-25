import { Command } from '@commander-js/extra-typings';
import type { CreateSegmentRequest, UpdateSegmentRequest } from '@nuntly/sdk';
import { confirmAction, createNuntlyClient } from '../auth.js';
import { resolveBody } from '../files.js';
import { parseFormat, printError, printResult } from '../output.js';
import { withSpinner } from '../spinner.js';

export const segmentsCommand = new Command('segments').description('Segments resource.');

const membersSub = new Command('members');
segmentsCommand.addCommand(membersSub);

membersSub
  .command('list')
  .description('List the members of a segment.')
  .argument('<segment-id>', 'The segmentId')
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
    "\nExample:\n  $ nuntly segments members list seg_01kabn43yqyxn2bx4ve84mczd3\n  $ nuntly segments members list seg_01kabn43yqyxn2bx4ve84mczd3 --format json | jq '.data[].id'",
  )
  .action(async (segmentId, opts, cmd) => {
    try {
      const { nuntly } = createNuntlyClient(cmd);
      if (opts.all) {
        const page = await withSpinner('Loading...', () =>
          nuntly.segments.members.list(segmentId, {
            cursor: opts.cursor,
            limit: opts.limit ? Number(opts.limit) : undefined,
          }),
        );
        const all = [] as typeof page.data;
        for await (const item of page) all.push(item);
        printResult({ data: all, nextCursor: null }, opts);
      } else {
        const page = await withSpinner('Loading...', () =>
          nuntly.segments.members.list(segmentId, {
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

segmentsCommand
  .command('create')
  .description('Create an organization-level static segment.')
  .option('--name <value>', 'A name for the segment, shown to your team. Stored lowercased and trimmed. (required)')
  .option('--file <path>', 'Read JSON body from file (use - for stdin)')
  .option('--format <fmt>', 'Output format: json, raw, yaml, csv, markdown, table, quiet', parseFormat)
  .option('-q, --quiet', 'Shorthand for --format quiet')
  .option('--raw', 'Shorthand for --format raw')
  .option('--fields <fields>', 'Comma-separated list of fields to display')
  .option('--no-header', 'Omit column headers in table/csv output')
  .addHelpText(
    'after',
    '\nExample:\n  $ nuntly segments create --name "vip customers"\n  $ cat payload.json | nuntly segments create --file -\n  $ nuntly segments create --file payload.json',
  )
  .action(async (opts, cmd) => {
    try {
      const { nuntly } = createNuntlyClient(cmd);
      const body = resolveBody(opts.file, {
        name: opts.name,
      });
      const result = await withSpinner('Creating...', () => nuntly.segments.create(body as CreateSegmentRequest));
      printResult(result, opts);
    } catch (error) {
      printError(error, opts);
    }
  });

segmentsCommand
  .command('delete')
  .description('Delete a segment.')
  .argument('<segment-id>', 'The segmentId')
  .option('--format <fmt>', 'Output format: json, raw, yaml, csv, markdown, table, quiet', parseFormat)
  .option('-q, --quiet', 'Shorthand for --format quiet')
  .option('--raw', 'Shorthand for --format raw')
  .option('--fields <fields>', 'Comma-separated list of fields to display')
  .option('--no-header', 'Omit column headers in table/csv output')
  .addHelpText('after', '\nExample:\n  $ nuntly segments delete seg_01kabn43yqyxn2bx4ve84mczd3')
  .action(async (segmentId, opts, cmd) => {
    try {
      const { nuntly, globals } = createNuntlyClient(cmd);
      if (!(await confirmAction('delete', 'segment', segmentId, !!globals.yes))) return;
      const result = await withSpinner('Deleting...', () => nuntly.segments.delete(segmentId));
      printResult(result, opts);
    } catch (error) {
      printError(error, opts);
    }
  });

segmentsCommand
  .command('list')
  .description('List the organization segments.')
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
    "\nExample:\n  $ nuntly segments list\n  $ nuntly segments list --format json | jq '.data[].id'",
  )
  .action(async (opts, cmd) => {
    try {
      const { nuntly } = createNuntlyClient(cmd);
      if (opts.all) {
        const page = await withSpinner('Loading...', () =>
          nuntly.segments.list({ cursor: opts.cursor, limit: opts.limit ? Number(opts.limit) : undefined }),
        );
        const all = [] as typeof page.data;
        for await (const item of page) all.push(item);
        printResult({ data: all, nextCursor: null }, opts);
      } else {
        const page = await withSpinner('Loading...', () =>
          nuntly.segments.list({ cursor: opts.cursor, limit: opts.limit ? Number(opts.limit) : undefined }),
        );
        printResult({ data: page.data, nextCursor: page.nextCursor }, opts);
      }
    } catch (error) {
      printError(error, opts);
    }
  });

segmentsCommand
  .command('retrieve')
  .description('Retrieve one segment.')
  .argument('<segment-id>', 'The segmentId')
  .option('--format <fmt>', 'Output format: json, raw, yaml, csv, markdown, table, quiet', parseFormat)
  .option('-q, --quiet', 'Shorthand for --format quiet')
  .option('--raw', 'Shorthand for --format raw')
  .option('--fields <fields>', 'Comma-separated list of fields to display')
  .option('--no-header', 'Omit column headers in table/csv output')
  .addHelpText('after', '\nExample:\n  $ nuntly segments retrieve seg_01kabn43yqyxn2bx4ve84mczd3')
  .action(async (segmentId, opts, cmd) => {
    try {
      const { nuntly } = createNuntlyClient(cmd);
      const result = await withSpinner('Loading...', () => nuntly.segments.retrieve(segmentId));
      printResult(result, opts);
    } catch (error) {
      printError(error, opts);
    }
  });

segmentsCommand
  .command('update')
  .description('Rename a segment.')
  .argument('<segment-id>', 'The segmentId')
  .option('--name <value>', 'A name for the segment, shown to your team. Stored lowercased and trimmed. (required)')
  .option('--file <path>', 'Read JSON body from file (use - for stdin)')
  .option('--format <fmt>', 'Output format: json, raw, yaml, csv, markdown, table, quiet', parseFormat)
  .option('-q, --quiet', 'Shorthand for --format quiet')
  .option('--raw', 'Shorthand for --format raw')
  .option('--fields <fields>', 'Comma-separated list of fields to display')
  .option('--no-header', 'Omit column headers in table/csv output')
  .addHelpText(
    'after',
    '\nExample:\n  $ nuntly segments update seg_01kabn43yqyxn2bx4ve84mczd3 --name "vip customers"\n  $ cat payload.json | nuntly segments update seg_01kabn43yqyxn2bx4ve84mczd3 --file -\n  $ nuntly segments update seg_01kabn43yqyxn2bx4ve84mczd3 --file payload.json',
  )
  .action(async (segmentId, opts, cmd) => {
    try {
      const { nuntly } = createNuntlyClient(cmd);
      const body = resolveBody(opts.file, {
        name: opts.name,
      });
      const result = await withSpinner('Updating...', () =>
        nuntly.segments.update(segmentId, body as UpdateSegmentRequest),
      );
      printResult(result, opts);
    } catch (error) {
      printError(error, opts);
    }
  });
