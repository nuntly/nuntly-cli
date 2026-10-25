import { Command } from '@commander-js/extra-typings';
import type { AgentMemoryRequest } from '@nuntly/sdk';
import { confirmAction, createNuntlyClient } from '../auth.js';
import { resolveBody } from '../files.js';
import { parseFormat, printError, printResult } from '../output.js';
import { withSpinner } from '../spinner.js';
import { nullable } from '../values.js';

export const agentsCommand = new Command('agents').description('Agents resource.');

const memorySub = new Command('memory');
agentsCommand.addCommand(memorySub);

memorySub
  .command('retrieve')
  .description(
    'Retrieves the key-value memory and summary saved for an AI agent, at organization level or scoped to one inbox or thread via query parameters.',
  )
  .argument('<agent-id>', 'The agentId')
  .option('--inbox-id <value>', 'The id of an inbox in your organization. Scopes memory to that inbox.')
  .option('--thread-id <value>', 'The id of a thread in your organization. Scopes memory to that thread.')
  .option('--format <fmt>', 'Output format: json, raw, yaml, csv, markdown, table, quiet', parseFormat)
  .option('-q, --quiet', 'Shorthand for --format quiet')
  .option('--raw', 'Shorthand for --format raw')
  .option('--fields <fields>', 'Comma-separated list of fields to display')
  .option('--no-header', 'Omit column headers in table/csv output')
  .addHelpText('after', '\nExample:\n  $ nuntly agents memory retrieve aB3dE7fG')
  .action(async (agentId, opts, cmd) => {
    try {
      const { nuntly } = createNuntlyClient(cmd);
      const result = await withSpinner('Loading...', () =>
        nuntly.agents.memory.retrieve(agentId, { inboxId: opts.inboxId, threadId: opts.threadId }),
      );
      printResult(result, opts);
    } catch (error) {
      printError(error, opts);
    }
  });

memorySub
  .command('upsert')
  .description(
    'Saves the key-value memory and optional summary of an AI agent, at organization level or scoped to a specific inbox or thread. Returns the saved memory.',
  )
  .argument('<agent-id>', 'The agentId')
  .option('--inbox-id <value>', 'The id of an inbox in your organization. Scopes memory to that inbox.')
  .option('--thread-id <value>', 'The id of a thread in your organization. Scopes memory to that thread.')
  .option('--memory <value>', 'The agent memory key-value data. (required)')
  .option('--summary <value>', 'A human-readable conversation summary. (null to clear)')
  .option('--file <path>', 'Read JSON body from file (use - for stdin)')
  .option('--format <fmt>', 'Output format: json, raw, yaml, csv, markdown, table, quiet', parseFormat)
  .option('-q, --quiet', 'Shorthand for --format quiet')
  .option('--raw', 'Shorthand for --format raw')
  .option('--fields <fields>', 'Comma-separated list of fields to display')
  .option('--no-header', 'Omit column headers in table/csv output')
  .addHelpText(
    'after',
    '\nExample:\n  $ nuntly agents memory upsert aB3dE7fG --memory \'{"lastTopic":"billing","openTickets":2}\'\n  $ cat payload.json | nuntly agents memory upsert aB3dE7fG --file -\n  $ nuntly agents memory upsert aB3dE7fG --file payload.json',
  )
  .action(async (agentId, opts, cmd) => {
    try {
      const { nuntly } = createNuntlyClient(cmd);
      const body = resolveBody(opts.file, {
        inboxId: opts.inboxId,
        threadId: opts.threadId,
        memory: opts.memory != null ? JSON.parse(opts.memory as string) : undefined,
        summary: nullable(opts.summary),
      });
      const result = await withSpinner('Updating...', () =>
        nuntly.agents.memory.upsert(agentId, body as AgentMemoryRequest),
      );
      printResult(result, opts);
    } catch (error) {
      printError(error, opts);
    }
  });
