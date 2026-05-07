import { Command } from '@commander-js/extra-typings';
import { Nuntly, type AgentMemoryRequest } from '@nuntly/sdk';
import { resolveApiKey, resolveBaseUrl, confirmDelete } from '../auth.js';
import { CLI_VERSION } from '../version.js';
import { printResult, printError } from '../output.js';
import { withSpinner } from '../spinner.js';
import { readInput } from '../files.js';

export const agentsCommand = new Command('agents')
  .description('Agents resource.');

const memorySub = new Command('memory');
agentsCommand.addCommand(memorySub);

memorySub
  .command('retrieve')
  .description('Retrieve the memory for an AI agent.')
  .argument('<agent-id>', 'The agentId')
  .option('--format <fmt>', 'Output format: json, raw, yaml, csv, markdown, table, quiet')
  .option('-q, --quiet', 'Shorthand for --format quiet')
  .option('--raw', 'Shorthand for --format raw')
  .option('--fields <fields>', 'Comma-separated list of fields to display')
  .option('--no-header', 'Omit column headers in table/csv output')
  .addHelpText('after', '\nExample:\n  $ nuntly agents memory retrieve ag_6789yzab')
  .action(async (agentId, opts) => {
    try {
      const nuntly = new Nuntly({ apiKey: resolveApiKey(), baseUrl: resolveBaseUrl(), appInfo: { name: '@nuntly/cli', version: CLI_VERSION } });
      const result = await withSpinner('Loading...', () => nuntly.agents.memory.retrieve(agentId));
      printResult(result, opts);
    } catch (error) {
      printError(error, opts);
    }
  });

memorySub
  .command('upsert')
  .description('Create or update the memory for an AI agent.')
  .argument('<agent-id>', 'The agentId')
  .option('--inbox-id <value>', 'The inbox id to scope the memory to.')
  .option('--thread-id <value>', 'The thread id to scope the memory to.')
  .option('--memory <value>', 'The agent memory key-value data. (required)')
  .option('--summary <value>', 'A human-readable conversation summary.')
  .option('--file <path>', 'Read JSON body from file (use - for stdin)')
  .option('--format <fmt>', 'Output format: json, raw, yaml, csv, markdown, table, quiet')
  .option('-q, --quiet', 'Shorthand for --format quiet')
  .option('--raw', 'Shorthand for --format raw')
  .option('--fields <fields>', 'Comma-separated list of fields to display')
  .option('--no-header', 'Omit column headers in table/csv output')
  .addHelpText('after', '\nExample:\n  $ nuntly agents memory upsert ag_6789yzab --memory "value"\n  $ cat payload.json | nuntly agents memory upsert ag_6789yzab\n  $ nuntly agents memory upsert ag_6789yzab --file payload.json')
  .action(async (agentId, opts) => {
    try {
      const nuntly = new Nuntly({ apiKey: resolveApiKey(), baseUrl: resolveBaseUrl(), appInfo: { name: '@nuntly/cli', version: CLI_VERSION } });
      const body = opts.file ? readInput(opts.file) : !process.stdin.isTTY ? readInput('-') : {
        inboxId: opts.inboxId,
        threadId: opts.threadId,
        memory: JSON.parse(opts.memory as string),
        summary: opts.summary
      };
      const result = await withSpinner('Updating...', () => nuntly.agents.memory.upsert(agentId, body as AgentMemoryRequest));
      printResult(result, opts);
    } catch (error) {
      printError(error, opts);
    }
  });

