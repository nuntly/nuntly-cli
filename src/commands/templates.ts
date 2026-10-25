import { Command } from '@commander-js/extra-typings';
import type { CreateTemplateRequest, CreateTemplateVersionRequest, UpdateTemplateRequest } from '@nuntly/sdk';
import { confirmAction, createNuntlyClient } from '../auth.js';
import { resolveBody } from '../files.js';
import { parseFormat, printError, printResult } from '../output.js';
import { withSpinner } from '../spinner.js';

export const templatesCommand = new Command('templates').description('Templates resource.');

const versionsSub = new Command('versions');
templatesCommand.addCommand(versionsSub);

versionsSub
  .command('create')
  .description('Create a draft version of a template.')
  .argument('<template-id>', 'The templateId')
  .option('--subject <value>', 'subject (required)')
  .option('--html <value>', 'html (required)')
  .option('--text <value>', 'The plain-text body.')
  .option('--variables <value>', 'Variables the content may reference, at most 20. Immutable once created.')
  .option('--file <path>', 'Read JSON body from file (use - for stdin)')
  .option('--format <fmt>', 'Output format: json, raw, yaml, csv, markdown, table, quiet', parseFormat)
  .option('-q, --quiet', 'Shorthand for --format quiet')
  .option('--raw', 'Shorthand for --format raw')
  .option('--fields <fields>', 'Comma-separated list of fields to display')
  .option('--no-header', 'Omit column headers in table/csv output')
  .addHelpText(
    'after',
    "\nExample:\n  $ nuntly templates versions create tpl_01kabn43yqyxn2bx4ve84mczd3 --subject \"Verify your email address\" --html '<h1>Welcome</h1><p>Thank you for signing up! Please verify your email address.</p>' --text 'Thank you for signing up! Please verify your email address.'\n  $ cat payload.json | nuntly templates versions create tpl_01kabn43yqyxn2bx4ve84mczd3 --file -\n  $ nuntly templates versions create tpl_01kabn43yqyxn2bx4ve84mczd3 --file payload.json",
  )
  .action(async (templateId, opts, cmd) => {
    try {
      const { nuntly } = createNuntlyClient(cmd);
      const body = resolveBody(opts.file, {
        subject: opts.subject,
        html: opts.html,
        text: opts.text,
        variables: opts.variables != null ? JSON.parse(opts.variables as string) : undefined,
      });
      const result = await withSpinner('Creating...', () =>
        nuntly.templates.versions.create(templateId, body as CreateTemplateVersionRequest),
      );
      printResult(result, opts);
    } catch (error) {
      printError(error, opts);
    }
  });

versionsSub
  .command('list')
  .description('List the versions of a template.')
  .argument('<template-id>', 'The templateId')
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
    "\nExample:\n  $ nuntly templates versions list tpl_01kabn43yqyxn2bx4ve84mczd3\n  $ nuntly templates versions list tpl_01kabn43yqyxn2bx4ve84mczd3 --format json | jq '.data[].id'",
  )
  .action(async (templateId, opts, cmd) => {
    try {
      const { nuntly } = createNuntlyClient(cmd);
      if (opts.all) {
        const page = await withSpinner('Loading...', () =>
          nuntly.templates.versions.list(templateId, {
            cursor: opts.cursor,
            limit: opts.limit ? Number(opts.limit) : undefined,
          }),
        );
        const all = [] as typeof page.data;
        for await (const item of page) all.push(item);
        printResult({ data: all, nextCursor: null }, opts);
      } else {
        const page = await withSpinner('Loading...', () =>
          nuntly.templates.versions.list(templateId, {
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

versionsSub
  .command('publish')
  .description('Publish a draft template version.')
  .argument('<template-id>', 'The templateId')
  .argument('<version-id>', 'The versionId')
  .option('--format <fmt>', 'Output format: json, raw, yaml, csv, markdown, table, quiet', parseFormat)
  .option('-q, --quiet', 'Shorthand for --format quiet')
  .option('--raw', 'Shorthand for --format raw')
  .option('--fields <fields>', 'Comma-separated list of fields to display')
  .option('--no-header', 'Omit column headers in table/csv output')
  .addHelpText(
    'after',
    '\nExample:\n  $ nuntly templates versions publish tpl_01kabn43yqyxn2bx4ve84mczd3 tpv_01kabn43yqyxn2bx4ve84mczd3',
  )
  .action(async (templateId, versionId, opts, cmd) => {
    try {
      const { nuntly } = createNuntlyClient(cmd);
      const result = await withSpinner('Updating...', () => nuntly.templates.versions.publish(templateId, versionId));
      printResult(result, opts);
    } catch (error) {
      printError(error, opts);
    }
  });

versionsSub
  .command('retrieve')
  .description('Retrieve one content version.')
  .argument('<template-id>', 'The templateId')
  .argument('<version-id>', 'The versionId')
  .option('--format <fmt>', 'Output format: json, raw, yaml, csv, markdown, table, quiet', parseFormat)
  .option('-q, --quiet', 'Shorthand for --format quiet')
  .option('--raw', 'Shorthand for --format raw')
  .option('--fields <fields>', 'Comma-separated list of fields to display')
  .option('--no-header', 'Omit column headers in table/csv output')
  .addHelpText(
    'after',
    '\nExample:\n  $ nuntly templates versions retrieve tpl_01kabn43yqyxn2bx4ve84mczd3 tpv_01kabn43yqyxn2bx4ve84mczd3',
  )
  .action(async (templateId, versionId, opts, cmd) => {
    try {
      const { nuntly } = createNuntlyClient(cmd);
      const result = await withSpinner('Loading...', () => nuntly.templates.versions.retrieve(templateId, versionId));
      printResult(result, opts);
    } catch (error) {
      printError(error, opts);
    }
  });

const versionsContentSub = new Command('content');
versionsSub.addCommand(versionsContentSub);

versionsContentSub
  .command('retrieve')
  .description("Get download links for a version's HTML and text.")
  .argument('<template-id>', 'The templateId')
  .argument('<version-id>', 'The versionId')
  .option('--format <fmt>', 'Output format: json, raw, yaml, csv, markdown, table, quiet', parseFormat)
  .option('-q, --quiet', 'Shorthand for --format quiet')
  .option('--raw', 'Shorthand for --format raw')
  .option('--fields <fields>', 'Comma-separated list of fields to display')
  .option('--no-header', 'Omit column headers in table/csv output')
  .addHelpText(
    'after',
    '\nExample:\n  $ nuntly templates versions content retrieve tpl_01kabn43yqyxn2bx4ve84mczd3 tpv_01kabn43yqyxn2bx4ve84mczd3',
  )
  .action(async (templateId, versionId, opts, cmd) => {
    try {
      const { nuntly } = createNuntlyClient(cmd);
      const result = await withSpinner('Loading...', () =>
        nuntly.templates.versions.content.retrieve(templateId, versionId),
      );
      printResult(result, opts);
    } catch (error) {
      printError(error, opts);
    }
  });

templatesCommand
  .command('create')
  .description('Create a template.')
  .option('--name <value>', 'A name for the template, shown only to your team. (required)')
  .option('--file <path>', 'Read JSON body from file (use - for stdin)')
  .option('--format <fmt>', 'Output format: json, raw, yaml, csv, markdown, table, quiet', parseFormat)
  .option('-q, --quiet', 'Shorthand for --format quiet')
  .option('--raw', 'Shorthand for --format raw')
  .option('--fields <fields>', 'Comma-separated list of fields to display')
  .option('--no-header', 'Omit column headers in table/csv output')
  .addHelpText(
    'after',
    '\nExample:\n  $ nuntly templates create --name "Welcome email"\n  $ cat payload.json | nuntly templates create --file -\n  $ nuntly templates create --file payload.json',
  )
  .action(async (opts, cmd) => {
    try {
      const { nuntly } = createNuntlyClient(cmd);
      const body = resolveBody(opts.file, {
        name: opts.name,
      });
      const result = await withSpinner('Creating...', () => nuntly.templates.create(body as CreateTemplateRequest));
      printResult(result, opts);
    } catch (error) {
      printError(error, opts);
    }
  });

templatesCommand
  .command('delete')
  .description('Delete a template and its versions.')
  .argument('<template-id>', 'The templateId')
  .option('--format <fmt>', 'Output format: json, raw, yaml, csv, markdown, table, quiet', parseFormat)
  .option('-q, --quiet', 'Shorthand for --format quiet')
  .option('--raw', 'Shorthand for --format raw')
  .option('--fields <fields>', 'Comma-separated list of fields to display')
  .option('--no-header', 'Omit column headers in table/csv output')
  .addHelpText('after', '\nExample:\n  $ nuntly templates delete tpl_01kabn43yqyxn2bx4ve84mczd3')
  .action(async (templateId, opts, cmd) => {
    try {
      const { nuntly, globals } = createNuntlyClient(cmd);
      if (!(await confirmAction('delete', 'template', templateId, !!globals.yes))) return;
      const result = await withSpinner('Deleting...', () => nuntly.templates.delete(templateId));
      printResult(result, opts);
    } catch (error) {
      printError(error, opts);
    }
  });

templatesCommand
  .command('list')
  .description('List the organization templates.')
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
    "\nExample:\n  $ nuntly templates list\n  $ nuntly templates list --format json | jq '.data[].id'",
  )
  .action(async (opts, cmd) => {
    try {
      const { nuntly } = createNuntlyClient(cmd);
      if (opts.all) {
        const page = await withSpinner('Loading...', () =>
          nuntly.templates.list({ cursor: opts.cursor, limit: opts.limit ? Number(opts.limit) : undefined }),
        );
        const all = [] as typeof page.data;
        for await (const item of page) all.push(item);
        printResult({ data: all, nextCursor: null }, opts);
      } else {
        const page = await withSpinner('Loading...', () =>
          nuntly.templates.list({ cursor: opts.cursor, limit: opts.limit ? Number(opts.limit) : undefined }),
        );
        printResult({ data: page.data, nextCursor: page.nextCursor }, opts);
      }
    } catch (error) {
      printError(error, opts);
    }
  });

templatesCommand
  .command('retrieve')
  .description('Retrieve one template.')
  .argument('<template-id>', 'The templateId')
  .option('--format <fmt>', 'Output format: json, raw, yaml, csv, markdown, table, quiet', parseFormat)
  .option('-q, --quiet', 'Shorthand for --format quiet')
  .option('--raw', 'Shorthand for --format raw')
  .option('--fields <fields>', 'Comma-separated list of fields to display')
  .option('--no-header', 'Omit column headers in table/csv output')
  .addHelpText('after', '\nExample:\n  $ nuntly templates retrieve tpl_01kabn43yqyxn2bx4ve84mczd3')
  .action(async (templateId, opts, cmd) => {
    try {
      const { nuntly } = createNuntlyClient(cmd);
      const result = await withSpinner('Loading...', () => nuntly.templates.retrieve(templateId));
      printResult(result, opts);
    } catch (error) {
      printError(error, opts);
    }
  });

templatesCommand
  .command('update')
  .description('Rename a template.')
  .argument('<template-id>', 'The templateId')
  .option('--name <value>', 'A name for the template, shown only to your team.')
  .option('--file <path>', 'Read JSON body from file (use - for stdin)')
  .option('--format <fmt>', 'Output format: json, raw, yaml, csv, markdown, table, quiet', parseFormat)
  .option('-q, --quiet', 'Shorthand for --format quiet')
  .option('--raw', 'Shorthand for --format raw')
  .option('--fields <fields>', 'Comma-separated list of fields to display')
  .option('--no-header', 'Omit column headers in table/csv output')
  .addHelpText(
    'after',
    '\nExample:\n  $ nuntly templates update tpl_01kabn43yqyxn2bx4ve84mczd3 --name "Welcome email"\n  $ cat payload.json | nuntly templates update tpl_01kabn43yqyxn2bx4ve84mczd3 --file -\n  $ nuntly templates update tpl_01kabn43yqyxn2bx4ve84mczd3 --file payload.json',
  )
  .action(async (templateId, opts, cmd) => {
    try {
      const { nuntly } = createNuntlyClient(cmd);
      const body = resolveBody(opts.file, {
        name: opts.name,
      });
      const result = await withSpinner('Updating...', () =>
        nuntly.templates.update(templateId, body as UpdateTemplateRequest),
      );
      printResult(result, opts);
    } catch (error) {
      printError(error, opts);
    }
  });
