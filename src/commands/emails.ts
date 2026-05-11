import { Command } from '@commander-js/extra-typings';
import { Nuntly, type CreateEmailRequest, type CreateBulkEmailsRequest } from '@nuntly/sdk';
import { resolveApiKey, resolveBaseUrl, confirmDelete } from '../auth.js';
import { CLI_VERSION } from '../version.js';
import { printResult, printError } from '../output.js';
import { withSpinner } from '../spinner.js';
import { readInput } from '../files.js';

export const emailsCommand = new Command('emails')
  .description('Emails resource.');

const bulkSub = new Command('bulk');
emailsCommand.addCommand(bulkSub);

bulkSub
  .command('list')
  .description('Returns the delivery status of all emails submitted in a bulk request.')
  .argument('<bulk-id>', 'The bulkId')
  .option('--format <fmt>', 'Output format: json, raw, yaml, csv, markdown, table, quiet')
  .option('-q, --quiet', 'Shorthand for --format quiet')
  .option('--raw', 'Shorthand for --format raw')
  .option('--fields <fields>', 'Comma-separated list of fields to display')
  .option('--no-header', 'Omit column headers in table/csv output')
  .addHelpText('after', '\nExample:\n  $ nuntly emails bulk list em_1234abcd')
  .action(async (bulkId, opts) => {
    try {
      const nuntly = new Nuntly({ apiKey: resolveApiKey(), baseUrl: resolveBaseUrl(), appInfo: { name: '@nuntly/cli', version: CLI_VERSION } });
      const result = await withSpinner('Loading...', () => nuntly.emails.bulk.list(bulkId));
      printResult(result, opts);
    } catch (error) {
      printError(error, opts);
    }
  });

bulkSub
  .command('send')
  .description('Send up to 20 emails in a single request. Use `fallback` to set default values shared across all messages.')
  .option('--fallback <value>', 'Used as a fallback field email value if no value is present in emails')
  .option('--emails <value>', 'The bulk emails to send (required)')
  .option('--file <path>', 'Read JSON body from file (use - for stdin)')
  .option('--format <fmt>', 'Output format: json, raw, yaml, csv, markdown, table, quiet')
  .option('-q, --quiet', 'Shorthand for --format quiet')
  .option('--raw', 'Shorthand for --format raw')
  .option('--fields <fields>', 'Comma-separated list of fields to display')
  .option('--no-header', 'Omit column headers in table/csv output')
  .addHelpText('after', '\nExample:\n  $ nuntly emails bulk send --emails "value"\n  $ cat payload.json | nuntly emails bulk send\n  $ nuntly emails bulk send --file payload.json')
  .action(async (opts) => {
    try {
      const nuntly = new Nuntly({ apiKey: resolveApiKey(), baseUrl: resolveBaseUrl(), appInfo: { name: '@nuntly/cli', version: CLI_VERSION } });
      const body = opts.file ? readInput(opts.file) : !process.stdin.isTTY ? readInput('-') : {
        fallback: opts.fallback != null ? JSON.parse(opts.fallback as string) : undefined,
        emails: JSON.parse(opts.emails as string)
      };
      const result = await withSpinner('Creating...', () => nuntly.emails.bulk.send(body as CreateBulkEmailsRequest));
      printResult(result, opts);
    } catch (error) {
      printError(error, opts);
    }
  });

const contentSub = new Command('content');
emailsCommand.addCommand(contentSub);

contentSub
  .command('retrieve')
  .description('Returns presigned URLs to download the HTML, plain-text, and raw MIME source of a sent email.')
  .argument('<id>', 'The id')
  .option('--format <fmt>', 'Output format: json, raw, yaml, csv, markdown, table, quiet')
  .option('-q, --quiet', 'Shorthand for --format quiet')
  .option('--raw', 'Shorthand for --format raw')
  .option('--fields <fields>', 'Comma-separated list of fields to display')
  .option('--no-header', 'Omit column headers in table/csv output')
  .addHelpText('after', '\nExample:\n  $ nuntly emails content retrieve em_1234abcd')
  .action(async (id, opts) => {
    try {
      const nuntly = new Nuntly({ apiKey: resolveApiKey(), baseUrl: resolveBaseUrl(), appInfo: { name: '@nuntly/cli', version: CLI_VERSION } });
      const result = await withSpinner('Loading...', () => nuntly.emails.content.retrieve(id));
      printResult(result, opts);
    } catch (error) {
      printError(error, opts);
    }
  });

const eventsSub = new Command('events');
emailsCommand.addCommand(eventsSub);

eventsSub
  .command('list')
  .description('Returns the full delivery event history for an email (sent, delivered, opened, bounced, etc.).')
  .argument('<id>', 'The id')
  .option('--format <fmt>', 'Output format: json, raw, yaml, csv, markdown, table, quiet')
  .option('-q, --quiet', 'Shorthand for --format quiet')
  .option('--raw', 'Shorthand for --format raw')
  .option('--fields <fields>', 'Comma-separated list of fields to display')
  .option('--no-header', 'Omit column headers in table/csv output')
  .addHelpText('after', '\nExample:\n  $ nuntly emails events list em_1234abcd')
  .action(async (id, opts) => {
    try {
      const nuntly = new Nuntly({ apiKey: resolveApiKey(), baseUrl: resolveBaseUrl(), appInfo: { name: '@nuntly/cli', version: CLI_VERSION } });
      const result = await withSpinner('Loading...', () => nuntly.emails.events.list(id));
      printResult(result, opts);
    } catch (error) {
      printError(error, opts);
    }
  });

const statsSub = new Command('stats');
emailsCommand.addCommand(statsSub);

statsSub
  .command('retrieve')
  .description('Returns aggregated daily sending statistics for the current period.')
  .option('--format <fmt>', 'Output format: json, raw, yaml, csv, markdown, table, quiet')
  .option('-q, --quiet', 'Shorthand for --format quiet')
  .option('--raw', 'Shorthand for --format raw')
  .option('--fields <fields>', 'Comma-separated list of fields to display')
  .option('--no-header', 'Omit column headers in table/csv output')
  .addHelpText('after', '\nExample:\n  $ nuntly emails stats retrieve')
  .action(async (opts) => {
    try {
      const nuntly = new Nuntly({ apiKey: resolveApiKey(), baseUrl: resolveBaseUrl(), appInfo: { name: '@nuntly/cli', version: CLI_VERSION } });
      const result = await withSpinner('Loading...', () => nuntly.emails.stats.retrieve());
      printResult(result, opts);
    } catch (error) {
      printError(error, opts);
    }
  });

emailsCommand
  .command('cancel')
  .description('Cancel a scheduled email before delivery. Only emails with `scheduled` status can be cancelled.')
  .argument('<id>', 'The id')
  .option('--format <fmt>', 'Output format: json, raw, yaml, csv, markdown, table, quiet')
  .option('-q, --quiet', 'Shorthand for --format quiet')
  .option('--raw', 'Shorthand for --format raw')
  .option('--fields <fields>', 'Comma-separated list of fields to display')
  .option('--no-header', 'Omit column headers in table/csv output')
  .addHelpText('after', '\nExample:\n  $ nuntly emails cancel em_1234abcd')
  .action(async (id, opts) => {
    try {
      if (!await confirmDelete('emails', id)) return;
      const nuntly = new Nuntly({ apiKey: resolveApiKey(), baseUrl: resolveBaseUrl(), appInfo: { name: '@nuntly/cli', version: CLI_VERSION } });
      const result = await withSpinner('Deleting...', () => nuntly.emails.cancel(id));
      printResult(result, opts);
    } catch (error) {
      printError(error, opts);
    }
  });

emailsCommand
  .command('list')
  .description('Returns sent emails ordered by submission date, newest first.')
  .option('--cursor <cursor>', 'Pagination cursor')
  .option('--limit <limit>', 'Max items to return')
  .option('--format <fmt>', 'Output format: json, raw, yaml, csv, markdown, table, quiet')
  .option('-q, --quiet', 'Shorthand for --format quiet')
  .option('--raw', 'Shorthand for --format raw')
  .option('--fields <fields>', 'Comma-separated list of fields to display')
  .option('--no-header', 'Omit column headers in table/csv output')
  .addHelpText('after', '\nExample:\n  $ nuntly emails list\n  $ nuntly emails list --format json | jq \'.data[].id\'')
  .action(async (opts) => {
    try {
      const nuntly = new Nuntly({ apiKey: resolveApiKey(), baseUrl: resolveBaseUrl(), appInfo: { name: '@nuntly/cli', version: CLI_VERSION } });
      const page = await withSpinner('Loading...', () => nuntly.emails.list({ cursor: opts.cursor, limit: opts.limit ? Number(opts.limit) : undefined }));
      printResult({ data: page.data, nextCursor: page.nextCursor }, opts);
    } catch (error) {
      printError(error, opts);
    }
  });

emailsCommand
  .command('retrieve')
  .description('Returns an email with its current delivery status and metadata.')
  .argument('<id>', 'The id')
  .option('--format <fmt>', 'Output format: json, raw, yaml, csv, markdown, table, quiet')
  .option('-q, --quiet', 'Shorthand for --format quiet')
  .option('--raw', 'Shorthand for --format raw')
  .option('--fields <fields>', 'Comma-separated list of fields to display')
  .option('--no-header', 'Omit column headers in table/csv output')
  .addHelpText('after', '\nExample:\n  $ nuntly emails retrieve em_1234abcd')
  .action(async (id, opts) => {
    try {
      const nuntly = new Nuntly({ apiKey: resolveApiKey(), baseUrl: resolveBaseUrl(), appInfo: { name: '@nuntly/cli', version: CLI_VERSION } });
      const result = await withSpinner('Loading...', () => nuntly.emails.retrieve(id));
      printResult(result, opts);
    } catch (error) {
      printError(error, opts);
    }
  });

emailsCommand
  .command('send')
  .description('Send transactional emails through Nuntly platform. It supports HTML and plain-text emails, attachments, labels, custom headers and scheduling.')
  .option('--from <value>', 'The e-mail address of the sender (required)')
  .option('--to <value>', 'The primary recipient(s) of the email (required)')
  .option('--cc <value>', 'The carbon copy recipient(s) of the email')
  .option('--bcc <value>', 'The blind carbon copy recipient(s) of the email')
  .option('--reply-to <value>', 'The email address where replies should be sent. If a recipient replies, the response will go to this address instead of the sender\'s email address')
  .option('--subject <value>', 'The subject of the e-mail (required)')
  .option('--text <value>', 'The plaintext version of the email')
  .option('--html <value>', 'The HTML version of the email')
  .option('--headers <value>', 'The headers to add to the email')
  .option('--tags <value>', 'The tags to add to the email')
  .option('--attachments <value>', 'The attachements to add to the email')
  .option('--variables <value>', 'The variables for the template')
  .option('--scheduled-at <value>', 'The date at which the email is scheduled to be sent')
  .option('--file <path>', 'Read JSON body from file (use - for stdin)')
  .option('--format <fmt>', 'Output format: json, raw, yaml, csv, markdown, table, quiet')
  .option('-q, --quiet', 'Shorthand for --format quiet')
  .option('--raw', 'Shorthand for --format raw')
  .option('--fields <fields>', 'Comma-separated list of fields to display')
  .option('--no-header', 'Omit column headers in table/csv output')
  .addHelpText('after', '\nExample:\n  $ nuntly emails send --from hello@acme.com --to user@example.com --subject "Welcome aboard"\n  $ cat payload.json | nuntly emails send\n  $ nuntly emails send --file payload.json')
  .action(async (opts) => {
    try {
      const nuntly = new Nuntly({ apiKey: resolveApiKey(), baseUrl: resolveBaseUrl(), appInfo: { name: '@nuntly/cli', version: CLI_VERSION } });
      const body = opts.file ? readInput(opts.file) : !process.stdin.isTTY ? readInput('-') : {
        from: opts.from,
        to: (opts.to as string).split(','),
        cc: opts.cc != null ? (opts.cc as string).split(',') : undefined,
        bcc: opts.bcc != null ? (opts.bcc as string).split(',') : undefined,
        replyTo: opts.replyTo != null ? (opts.replyTo as string).split(',') : undefined,
        subject: opts.subject,
        text: opts.text,
        html: opts.html,
        headers: opts.headers != null ? JSON.parse(opts.headers as string) : undefined,
        tags: opts.tags != null ? JSON.parse(opts.tags as string) : undefined,
        attachments: opts.attachments != null ? JSON.parse(opts.attachments as string) : undefined,
        variables: opts.variables != null ? JSON.parse(opts.variables as string) : undefined,
        scheduledAt: opts.scheduledAt
      };
      const result = await withSpinner('Creating...', () => nuntly.emails.send(body as CreateEmailRequest));
      printResult(result, opts);
    } catch (error) {
      printError(error, opts);
    }
  });

