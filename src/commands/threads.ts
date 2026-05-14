import { Command } from '@commander-js/extra-typings';
import { Nuntly, type UpdateThreadRequest } from '@nuntly/sdk';
import { resolveApiKey, resolveBaseUrl, confirmDelete } from '../auth.js';
import { CLI_VERSION } from '../version.js';
import { printResult, printError } from '../output.js';
import { withSpinner } from '../spinner.js';
import { readInput } from '../files.js';

export const threadsCommand = new Command('threads')
  .description('Threads resource.');

const messagesSub = new Command('messages');
threadsCommand.addCommand(messagesSub);

messagesSub
  .command('list')
  .description('List messages in a thread (chronological order).')
  .argument('<thread-id>', 'The threadId')
  .option('--cursor <cursor>', 'Pagination cursor')
  .option('--limit <limit>', 'Max items to return')
  .option('--format <fmt>', 'Output format: json, raw, yaml, csv, markdown, table, quiet')
  .option('-q, --quiet', 'Shorthand for --format quiet')
  .option('--raw', 'Shorthand for --format raw')
  .option('--fields <fields>', 'Comma-separated list of fields to display')
  .option('--no-header', 'Omit column headers in table/csv output')
  .addHelpText('after', '\nExample:\n  $ nuntly threads messages list th_0123cdef\n  $ nuntly threads messages list th_0123cdef --format json | jq \'.data[].id\'')
  .action(async (threadId, opts) => {
    try {
      const nuntly = new Nuntly({ apiKey: resolveApiKey(), baseUrl: resolveBaseUrl(), appInfo: { name: '@nuntly/cli', version: CLI_VERSION } });
      const page = await withSpinner('Loading...', () => nuntly.threads.messages.list(threadId, { cursor: opts.cursor, limit: opts.limit ? Number(opts.limit) : undefined }));
      printResult({ data: page.data, nextCursor: page.nextCursor }, opts);
    } catch (error) {
      printError(error, opts);
    }
  });

threadsCommand
  .command('retrieve')
  .description('Retrieve a thread. Pass ?markRead=true to automatically remove the unread label from all messages.')
  .argument('<thread-id>', 'The threadId')
  .option('--format <fmt>', 'Output format: json, raw, yaml, csv, markdown, table, quiet')
  .option('-q, --quiet', 'Shorthand for --format quiet')
  .option('--raw', 'Shorthand for --format raw')
  .option('--fields <fields>', 'Comma-separated list of fields to display')
  .option('--no-header', 'Omit column headers in table/csv output')
  .addHelpText('after', '\nExample:\n  $ nuntly threads retrieve th_0123cdef')
  .action(async (threadId, opts) => {
    try {
      const nuntly = new Nuntly({ apiKey: resolveApiKey(), baseUrl: resolveBaseUrl(), appInfo: { name: '@nuntly/cli', version: CLI_VERSION } });
      const result = await withSpinner('Loading...', () => nuntly.threads.retrieve(threadId));
      printResult(result, opts);
    } catch (error) {
      printError(error, opts);
    }
  });

threadsCommand
  .command('update')
  .description('Update thread labels and agent assignment. Label operations apply to all messages in the thread.')
  .argument('<thread-id>', 'The threadId')
  .option('--add-labels <value>', 'Labels to add to all messages in the thread.')
  .option('--remove-labels <value>', 'Labels to remove from all messages in the thread.')
  .option('--agent-id <value>', 'The AI agent identifier.')
  .option('--file <path>', 'Read JSON body from file (use - for stdin)')
  .option('--format <fmt>', 'Output format: json, raw, yaml, csv, markdown, table, quiet')
  .option('-q, --quiet', 'Shorthand for --format quiet')
  .option('--raw', 'Shorthand for --format raw')
  .option('--fields <fields>', 'Comma-separated list of fields to display')
  .option('--no-header', 'Omit column headers in table/csv output')
  .addHelpText('after', '\nExample:\n  $ nuntly threads update th_0123cdef --agent-id agent_abc123\n  $ cat payload.json | nuntly threads update th_0123cdef\n  $ nuntly threads update th_0123cdef --file payload.json')
  .action(async (threadId, opts) => {
    try {
      const nuntly = new Nuntly({ apiKey: resolveApiKey(), baseUrl: resolveBaseUrl(), appInfo: { name: '@nuntly/cli', version: CLI_VERSION } });
      const body = opts.file ? readInput(opts.file) : !process.stdin.isTTY ? readInput('-') : {
        addLabels: opts.addLabels != null ? (opts.addLabels as string).split(',') : undefined,
        removeLabels: opts.removeLabels != null ? (opts.removeLabels as string).split(',') : undefined,
        agentId: opts.agentId
      };
      const result = await withSpinner('Updating...', () => nuntly.threads.update(threadId, body as UpdateThreadRequest));
      printResult(result, opts);
    } catch (error) {
      printError(error, opts);
    }
  });

