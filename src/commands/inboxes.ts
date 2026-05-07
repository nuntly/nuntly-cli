import { Command } from '@commander-js/extra-typings';
import { Nuntly, type CreateInboxRequest, type UpdateInboxRequest, type SendMessageRequest } from '@nuntly/sdk';
import { resolveApiKey, resolveBaseUrl, confirmDelete } from '../auth.js';
import { CLI_VERSION } from '../version.js';
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
  .option('--format <fmt>', 'Output format: json, raw, yaml, csv, markdown, table, quiet')
  .option('-q, --quiet', 'Shorthand for --format quiet')
  .option('--raw', 'Shorthand for --format raw')
  .option('--fields <fields>', 'Comma-separated list of fields to display')
  .option('--no-header', 'Omit column headers in table/csv output')
  .addHelpText('after', '\nExample:\n  $ nuntly inboxes threads list ib_7890qrst\n  $ nuntly inboxes threads list ib_7890qrst --format json | jq \'.data[].id\'')
  .action(async (inboxId, opts) => {
    try {
      const nuntly = new Nuntly({ apiKey: resolveApiKey(), baseUrl: resolveBaseUrl(), appInfo: { name: '@nuntly/cli', version: CLI_VERSION } });
      const page = await withSpinner('Loading...', () => nuntly.inboxes.threads.list(inboxId, { cursor: opts.cursor, limit: opts.limit ? Number(opts.limit) : undefined }));
      printResult({ data: page.data, nextCursor: page.nextCursor }, opts);
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
  .option('--to <value>', 'The recipient addresses. (required)')
  .option('--cc <value>', 'The CC addresses.')
  .option('--bcc <value>', 'The BCC addresses.')
  .option('--subject <value>', 'The message subject. (required)')
  .option('--text <value>', 'The plain text body.')
  .option('--html <value>', 'The HTML body.')
  .option('--file <path>', 'Read JSON body from file (use - for stdin)')
  .option('--format <fmt>', 'Output format: json, raw, yaml, csv, markdown, table, quiet')
  .option('-q, --quiet', 'Shorthand for --format quiet')
  .option('--raw', 'Shorthand for --format raw')
  .option('--fields <fields>', 'Comma-separated list of fields to display')
  .option('--no-header', 'Omit column headers in table/csv output')
  .addHelpText('after', '\nExample:\n  $ nuntly inboxes messages send ib_7890qrst --to user@example.com --subject "Welcome aboard"\n  $ cat payload.json | nuntly inboxes messages send ib_7890qrst\n  $ nuntly inboxes messages send ib_7890qrst --file payload.json')
  .action(async (inboxId, opts) => {
    try {
      const nuntly = new Nuntly({ apiKey: resolveApiKey(), baseUrl: resolveBaseUrl(), appInfo: { name: '@nuntly/cli', version: CLI_VERSION } });
      const body = opts.file ? readInput(opts.file) : !process.stdin.isTTY ? readInput('-') : {
        to: (opts.to as string).split(','),
        cc: opts.cc != null ? (opts.cc as string).split(',') : undefined,
        bcc: opts.bcc != null ? (opts.bcc as string).split(',') : undefined,
        subject: opts.subject,
        text: opts.text,
        html: opts.html
      };
      const result = await withSpinner('Creating...', () => nuntly.inboxes.messages.send(inboxId, body as SendMessageRequest));
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
  .action(async (opts) => {
    try {
      const nuntly = new Nuntly({ apiKey: resolveApiKey(), baseUrl: resolveBaseUrl(), appInfo: { name: '@nuntly/cli', version: CLI_VERSION } });
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
  .command('list')
  .description('List all inboxes.')
  .option('--cursor <cursor>', 'Pagination cursor')
  .option('--limit <limit>', 'Max items to return')
  .option('--format <fmt>', 'Output format: json, raw, yaml, csv, markdown, table, quiet')
  .option('-q, --quiet', 'Shorthand for --format quiet')
  .option('--raw', 'Shorthand for --format raw')
  .option('--fields <fields>', 'Comma-separated list of fields to display')
  .option('--no-header', 'Omit column headers in table/csv output')
  .addHelpText('after', '\nExample:\n  $ nuntly inboxes list\n  $ nuntly inboxes list --format json | jq \'.data[].id\'')
  .action(async (opts) => {
    try {
      const nuntly = new Nuntly({ apiKey: resolveApiKey(), baseUrl: resolveBaseUrl(), appInfo: { name: '@nuntly/cli', version: CLI_VERSION } });
      const page = await withSpinner('Loading...', () => nuntly.inboxes.list({ cursor: opts.cursor, limit: opts.limit ? Number(opts.limit) : undefined }));
      printResult({ data: page.data, nextCursor: page.nextCursor }, opts);
    } catch (error) {
      printError(error, opts);
    }
  });

inboxesCommand
  .command('retrieve')
  .description('Retrieve an inbox with thread stats.')
  .argument('<inbox-id>', 'The inboxId')
  .option('--format <fmt>', 'Output format: json, raw, yaml, csv, markdown, table, quiet')
  .option('-q, --quiet', 'Shorthand for --format quiet')
  .option('--raw', 'Shorthand for --format raw')
  .option('--fields <fields>', 'Comma-separated list of fields to display')
  .option('--no-header', 'Omit column headers in table/csv output')
  .addHelpText('after', '\nExample:\n  $ nuntly inboxes retrieve ib_7890qrst')
  .action(async (inboxId, opts) => {
    try {
      const nuntly = new Nuntly({ apiKey: resolveApiKey(), baseUrl: resolveBaseUrl(), appInfo: { name: '@nuntly/cli', version: CLI_VERSION } });
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
  .addHelpText('after', '\nExample:\n  $ nuntly inboxes update ib_7890qrst\n  $ cat payload.json | nuntly inboxes update ib_7890qrst\n  $ nuntly inboxes update ib_7890qrst --file payload.json')
  .action(async (inboxId, opts) => {
    try {
      const nuntly = new Nuntly({ apiKey: resolveApiKey(), baseUrl: resolveBaseUrl(), appInfo: { name: '@nuntly/cli', version: CLI_VERSION } });
      const body = opts.file ? readInput(opts.file) : !process.stdin.isTTY ? readInput('-') : {
        name: opts.name
      };
      const result = await withSpinner('Updating...', () => nuntly.inboxes.update(inboxId, body as UpdateInboxRequest));
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
  .action(async (inboxId, opts) => {
    try {
      if (!await confirmDelete('inboxes', inboxId)) return;
      const nuntly = new Nuntly({ apiKey: resolveApiKey(), baseUrl: resolveBaseUrl(), appInfo: { name: '@nuntly/cli', version: CLI_VERSION } });
      const result = await withSpinner('Deleting...', () => nuntly.inboxes.delete(inboxId));
      printResult(result, opts);
    } catch (error) {
      printError(error, opts);
    }
  });

