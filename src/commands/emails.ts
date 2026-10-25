import { Command } from '@commander-js/extra-typings';
import type { CreateBulkEmailsRequest, CreateEmailRequest } from '@nuntly/sdk';
import { confirmAction, createNuntlyClient } from '../auth.js';
import { resolveBody } from '../files.js';
import { parseFormat, printError, printResult } from '../output.js';
import { withSpinner } from '../spinner.js';

export const emailsCommand = new Command('emails').description('Emails resource.');

const eventsSub = new Command('events');
emailsCommand.addCommand(eventsSub);

eventsSub
  .command('list')
  .description(
    'Returns the full event history of an email, newest first, such as queued, sent, delivered, opened, clicked or bounced. The list is not paginated.',
  )
  .argument('<id>', 'The id')
  .option('--format <fmt>', 'Output format: json, raw, yaml, csv, markdown, table, quiet', parseFormat)
  .option('-q, --quiet', 'Shorthand for --format quiet')
  .option('--raw', 'Shorthand for --format raw')
  .option('--fields <fields>', 'Comma-separated list of fields to display')
  .option('--no-header', 'Omit column headers in table/csv output')
  .addHelpText('after', '\nExample:\n  $ nuntly emails events list em_01ka8k8s80gvx9604cn9am5st4')
  .action(async (id, opts, cmd) => {
    try {
      const { nuntly } = createNuntlyClient(cmd);
      const result = await withSpinner('Loading...', () => nuntly.emails.events.list(id));
      printResult(result, opts);
    } catch (error) {
      printError(error, opts);
    }
  });

const bulkSub = new Command('bulk');
emailsCommand.addCommand(bulkSub);

bulkSub
  .command('retrieve')
  .description(
    'Returns the emails created by a bulk request, with the id and current status of each one, looked up by the bulk id returned when it was sent.',
  )
  .argument('<bulk-id>', 'The bulkId')
  .option('--format <fmt>', 'Output format: json, raw, yaml, csv, markdown, table, quiet', parseFormat)
  .option('-q, --quiet', 'Shorthand for --format quiet')
  .option('--raw', 'Shorthand for --format raw')
  .option('--fields <fields>', 'Comma-separated list of fields to display')
  .option('--no-header', 'Omit column headers in table/csv output')
  .addHelpText('after', '\nExample:\n  $ nuntly emails bulk retrieve blk_01ka8k8s80gvx9604cn9am5st4')
  .action(async (bulkId, opts, cmd) => {
    try {
      const { nuntly } = createNuntlyClient(cmd);
      const result = await withSpinner('Loading...', () => nuntly.emails.bulk.retrieve(bulkId));
      printResult(result, opts);
    } catch (error) {
      printError(error, opts);
    }
  });

bulkSub
  .command('send')
  .description(
    'Queues 1 to 20 emails in one request with optional shared fallback values, and returns a bulk id plus the id and status of each email. No scheduling.',
  )
  .option('--fallback <value>', 'Used as a fallback field email value if no value is present in emails.')
  .option('--emails <value>', 'The bulk emails to send. (required)')
  .option('--file <path>', 'Read JSON body from file (use - for stdin)')
  .option('--idempotency-key <key>', 'Idempotency-Key header (auto-generated when omitted)')
  .option('--format <fmt>', 'Output format: json, raw, yaml, csv, markdown, table, quiet', parseFormat)
  .option('-q, --quiet', 'Shorthand for --format quiet')
  .option('--raw', 'Shorthand for --format raw')
  .option('--fields <fields>', 'Comma-separated list of fields to display')
  .option('--no-header', 'Omit column headers in table/csv output')
  .addHelpText(
    'after',
    '\nExample:\n  $ nuntly emails bulk send --emails \'[{"from":"Tomlinson AI <ray@info.tomlinson.ai>","to":"brian67@gmail.com","subject":"Verify your email address","text":"Thank you for signing up! Please verify your email address."}]\'\n  $ cat payload.json | nuntly emails bulk send --file -\n  $ nuntly emails bulk send --file payload.json',
  )
  .action(async (opts, cmd) => {
    try {
      const { nuntly } = createNuntlyClient(cmd);
      const body = resolveBody(opts.file, {
        fallback: opts.fallback != null ? JSON.parse(opts.fallback as string) : undefined,
        emails: opts.emails != null ? JSON.parse(opts.emails as string) : undefined,
      });
      const result = await withSpinner('Creating...', () =>
        nuntly.emails.bulk.send(
          body as CreateBulkEmailsRequest,
          opts.idempotencyKey ? { idempotencyKey: opts.idempotencyKey as string } : undefined,
        ),
      );
      printResult(result, opts);
    } catch (error) {
      printError(error, opts);
    }
  });

const contentSub = new Command('content');
emailsCommand.addCommand(contentSub);

contentSub
  .command('retrieve')
  .description(
    'Returns download links, valid for 2 minutes, for the HTML, plain-text and raw MIME versions of an email, plus its stored subject and body templates.',
  )
  .argument('<id>', 'The id')
  .option('--format <fmt>', 'Output format: json, raw, yaml, csv, markdown, table, quiet', parseFormat)
  .option('-q, --quiet', 'Shorthand for --format quiet')
  .option('--raw', 'Shorthand for --format raw')
  .option('--fields <fields>', 'Comma-separated list of fields to display')
  .option('--no-header', 'Omit column headers in table/csv output')
  .addHelpText('after', '\nExample:\n  $ nuntly emails content retrieve em_01ka8k8s80gvx9604cn9am5st4')
  .action(async (id, opts, cmd) => {
    try {
      const { nuntly } = createNuntlyClient(cmd);
      const result = await withSpinner('Loading...', () => nuntly.emails.content.retrieve(id));
      printResult(result, opts);
    } catch (error) {
      printError(error, opts);
    }
  });

const statsSub = new Command('stats');
emailsCommand.addCommand(statsSub);

statsSub
  .command('retrieve')
  .description(
    'Returns daily email counts for the last 30 days and today, per status and engagement type (sent, delivered, bounced, opened, clicked and more).',
  )
  .option('--format <fmt>', 'Output format: json, raw, yaml, csv, markdown, table, quiet', parseFormat)
  .option('-q, --quiet', 'Shorthand for --format quiet')
  .option('--raw', 'Shorthand for --format raw')
  .option('--fields <fields>', 'Comma-separated list of fields to display')
  .option('--no-header', 'Omit column headers in table/csv output')
  .addHelpText('after', '\nExample:\n  $ nuntly emails stats retrieve')
  .action(async (opts, cmd) => {
    try {
      const { nuntly } = createNuntlyClient(cmd);
      const result = await withSpinner('Loading...', () => nuntly.emails.stats.retrieve());
      printResult(result, opts);
    } catch (error) {
      printError(error, opts);
    }
  });

emailsCommand
  .command('cancel')
  .description(
    'Cancels a scheduled email before it is sent and returns its id with status canceled. Only scheduled emails sent outside a bulk request qualify.',
  )
  .argument('<id>', 'The id')
  .option('--format <fmt>', 'Output format: json, raw, yaml, csv, markdown, table, quiet', parseFormat)
  .option('-q, --quiet', 'Shorthand for --format quiet')
  .option('--raw', 'Shorthand for --format raw')
  .option('--fields <fields>', 'Comma-separated list of fields to display')
  .option('--no-header', 'Omit column headers in table/csv output')
  .addHelpText('after', '\nExample:\n  $ nuntly emails cancel em_01ka8k8s80gvx9604cn9am5st4')
  .action(async (id, opts, cmd) => {
    try {
      const { nuntly, globals } = createNuntlyClient(cmd);
      if (!(await confirmAction('delete', 'email', id, !!globals.yes))) return;
      const result = await withSpinner('Deleting...', () => nuntly.emails.cancel(id));
      printResult(result, opts);
    } catch (error) {
      printError(error, opts);
    }
  });

emailsCommand
  .command('list')
  .description(
    'Lists your emails newest first with cursor pagination, up to 30 per page. Each item has its sender, recipients, subject, status and submission date.',
  )
  .option('--cursor <cursor>', 'Pagination cursor')
  .option('--limit <limit>', 'The maximum number of results to return, from 1 to 30. Defaults to 30.')
  .option('--all', 'Fetch all pages (auto-paginate)')
  .option('--format <fmt>', 'Output format: json, raw, yaml, csv, markdown, table, quiet', parseFormat)
  .option('-q, --quiet', 'Shorthand for --format quiet')
  .option('--raw', 'Shorthand for --format raw')
  .option('--fields <fields>', 'Comma-separated list of fields to display')
  .option('--no-header', 'Omit column headers in table/csv output')
  .addHelpText('after', "\nExample:\n  $ nuntly emails list\n  $ nuntly emails list --format json | jq '.data[].id'")
  .action(async (opts, cmd) => {
    try {
      const { nuntly } = createNuntlyClient(cmd);
      if (opts.all) {
        const page = await withSpinner('Loading...', () =>
          nuntly.emails.list({ cursor: opts.cursor, limit: opts.limit ? Number(opts.limit) : undefined }),
        );
        const all = [] as typeof page.data;
        for await (const item of page) all.push(item);
        printResult({ data: all, nextCursor: null }, opts);
      } else {
        const page = await withSpinner('Loading...', () =>
          nuntly.emails.list({ cursor: opts.cursor, limit: opts.limit ? Number(opts.limit) : undefined }),
        );
        printResult({ data: page.data, nextCursor: page.nextCursor }, opts);
      }
    } catch (error) {
      printError(error, opts);
    }
  });

emailsCommand
  .command('retrieve')
  .description(
    'Returns a single email by id with its delivery status, status reason, recipients, subject, headers, tags, attachment metadata and schedule.',
  )
  .argument('<id>', 'The id')
  .option('--format <fmt>', 'Output format: json, raw, yaml, csv, markdown, table, quiet', parseFormat)
  .option('-q, --quiet', 'Shorthand for --format quiet')
  .option('--raw', 'Shorthand for --format raw')
  .option('--fields <fields>', 'Comma-separated list of fields to display')
  .option('--no-header', 'Omit column headers in table/csv output')
  .addHelpText('after', '\nExample:\n  $ nuntly emails retrieve em_01ka8k8s80gvx9604cn9am5st4')
  .action(async (id, opts, cmd) => {
    try {
      const { nuntly } = createNuntlyClient(cmd);
      const result = await withSpinner('Loading...', () => nuntly.emails.retrieve(id));
      printResult(result, opts);
    } catch (error) {
      printError(error, opts);
    }
  });

emailsCommand
  .command('send')
  .description(
    'Send transactional emails through Nuntly platform. It supports HTML and plain-text emails, attachments, labels, custom headers and scheduling.',
  )
  .option('--from <value>', 'The e-mail address of the sender (required)')
  .option(
    '--to <value>',
    'The primary recipient(s) of the email (repeatable) (required)',
    (value: string, acc: string[] = []) => acc.concat(value),
    [] as string[],
  )
  .option(
    '--cc <value>',
    'The carbon copy recipient(s) of the email (repeatable)',
    (value: string, acc: string[] = []) => acc.concat(value),
    [] as string[],
  )
  .option(
    '--bcc <value>',
    'The blind carbon copy recipient(s) of the email (repeatable)',
    (value: string, acc: string[] = []) => acc.concat(value),
    [] as string[],
  )
  .option(
    '--reply-to <value>',
    "The email address where replies should be sent. If a recipient replies, the response will go to this address instead of the sender's email address (repeatable)",
    (value: string, acc: string[] = []) => acc.concat(value),
    [] as string[],
  )
  .option('--subject <value>', 'The subject of the e-mail (required)')
  .option('--text <value>', 'The plaintext version of the email')
  .option('--html <value>', 'The HTML version of the email')
  .option('--headers <value>', 'The headers to add to the email')
  .option('--tags <value>', 'The tags to add to the email')
  .option('--attachments <value>', 'The attachements to add to the email')
  .option('--variables <value>', 'The variables for the template')
  .option('--scheduled-at <value>', 'The date at which the email is scheduled to be sent')
  .option('--file <path>', 'Read JSON body from file (use - for stdin)')
  .option('--idempotency-key <key>', 'Idempotency-Key header (auto-generated when omitted)')
  .option('--format <fmt>', 'Output format: json, raw, yaml, csv, markdown, table, quiet', parseFormat)
  .option('-q, --quiet', 'Shorthand for --format quiet')
  .option('--raw', 'Shorthand for --format raw')
  .option('--fields <fields>', 'Comma-separated list of fields to display')
  .option('--no-header', 'Omit column headers in table/csv output')
  .addHelpText(
    'after',
    '\nExample:\n  $ nuntly emails send --from "Tomlinson AI <ray@info.tomlinson.ai>" --to brian67@gmail.com --subject "Verify your email address" --text \'Thank you for signing up! Please verify your email address.\' --html \'<h1>Welcome 🎉</h1><p>Thank you for signing up! Please verify your email address.</p>\' --tags \'[{"name":"category","value":"transactional"}]\'\n  $ cat payload.json | nuntly emails send --file -\n  $ nuntly emails send --file payload.json',
  )
  .action(async (opts, cmd) => {
    try {
      const { nuntly } = createNuntlyClient(cmd);
      const body = resolveBody(opts.file, {
        from: opts.from,
        to: (opts.to as string[] | undefined)?.length ? (opts.to as string[]) : undefined,
        cc: (opts.cc as string[] | undefined)?.length ? (opts.cc as string[]) : undefined,
        bcc: (opts.bcc as string[] | undefined)?.length ? (opts.bcc as string[]) : undefined,
        replyTo: (opts.replyTo as string[] | undefined)?.length ? (opts.replyTo as string[]) : undefined,
        subject: opts.subject,
        text: opts.text,
        html: opts.html,
        headers: opts.headers != null ? JSON.parse(opts.headers as string) : undefined,
        tags: opts.tags != null ? JSON.parse(opts.tags as string) : undefined,
        attachments: opts.attachments != null ? JSON.parse(opts.attachments as string) : undefined,
        variables: opts.variables != null ? JSON.parse(opts.variables as string) : undefined,
        scheduledAt: opts.scheduledAt,
      });
      const result = await withSpinner('Creating...', () =>
        nuntly.emails.send(
          body as CreateEmailRequest,
          opts.idempotencyKey ? { idempotencyKey: opts.idempotencyKey as string } : undefined,
        ),
      );
      printResult(result, opts);
    } catch (error) {
      printError(error, opts);
    }
  });
