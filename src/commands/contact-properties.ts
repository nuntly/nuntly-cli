import { Command, Option } from '@commander-js/extra-typings';
import type { CreateContactPropertyRequest, UpdateContactPropertyRequest } from '@nuntly/sdk';
import { confirmAction, createNuntlyClient } from '../auth.js';
import { resolveBody } from '../files.js';
import { parseFormat, printError, printResult } from '../output.js';
import { withSpinner } from '../spinner.js';
import { nullable, stringOrNumber } from '../values.js';

export const contactPropertiesCommand = new Command('contact-properties').description('ContactProperties resource.');

contactPropertiesCommand
  .command('create')
  .description('Create a contact property.')
  .option(
    '--name <value>',
    "A name for the property, used as its key in a contact's properties. Stored trimmed, with the letter case it was typed with. (required)",
  )
  .addOption(
    new Option('--type <value>', 'The declared type of the property. Immutable after creation. (required)').choices([
      'string',
      'number',
    ] as const),
  )
  .option('--description <value>', 'An optional description of the property. (null to clear)')
  .option(
    '--default-value <value>',
    'Applied to new contacts that omit this property. (a numeric value is sent as a number; wrap it in JSON quotes to send it as text) (null to clear)',
  )
  .option('--file <path>', 'Read JSON body from file (use - for stdin)')
  .option('--format <fmt>', 'Output format: json, raw, yaml, csv, markdown, table, quiet', parseFormat)
  .option('-q, --quiet', 'Shorthand for --format quiet')
  .option('--raw', 'Shorthand for --format raw')
  .option('--fields <fields>', 'Comma-separated list of fields to display')
  .option('--no-header', 'Omit column headers in table/csv output')
  .addHelpText(
    'after',
    '\nExample:\n  $ nuntly contact-properties create --name plan --type string\n  $ cat payload.json | nuntly contact-properties create --file -\n  $ nuntly contact-properties create --file payload.json',
  )
  .action(async (opts, cmd) => {
    try {
      const { nuntly } = createNuntlyClient(cmd);
      const body = resolveBody(opts.file, {
        name: opts.name,
        type: opts.type,
        description: nullable(opts.description),
        defaultValue: opts.defaultValue === 'null' ? null : stringOrNumber(opts.defaultValue),
      });
      const result = await withSpinner('Creating...', () =>
        nuntly.contactProperties.create(body as CreateContactPropertyRequest),
      );
      printResult(result, opts);
    } catch (error) {
      printError(error, opts);
    }
  });

contactPropertiesCommand
  .command('delete')
  .description('Delete a contact property.')
  .argument('<contact-property-id>', 'The contactPropertyId')
  .option('--format <fmt>', 'Output format: json, raw, yaml, csv, markdown, table, quiet', parseFormat)
  .option('-q, --quiet', 'Shorthand for --format quiet')
  .option('--raw', 'Shorthand for --format raw')
  .option('--fields <fields>', 'Comma-separated list of fields to display')
  .option('--no-header', 'Omit column headers in table/csv output')
  .addHelpText('after', '\nExample:\n  $ nuntly contact-properties delete ctpd_01kabn43yqyxn2bx4ve84mczd3')
  .action(async (contactPropertyId, opts, cmd) => {
    try {
      const { nuntly, globals } = createNuntlyClient(cmd);
      if (!(await confirmAction('delete', 'contact property', contactPropertyId, !!globals.yes))) return;
      const result = await withSpinner('Deleting...', () => nuntly.contactProperties.delete(contactPropertyId));
      printResult(result, opts);
    } catch (error) {
      printError(error, opts);
    }
  });

contactPropertiesCommand
  .command('list')
  .description('List the organization contact properties.')
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
    "\nExample:\n  $ nuntly contact-properties list\n  $ nuntly contact-properties list --format json | jq '.data[].id'",
  )
  .action(async (opts, cmd) => {
    try {
      const { nuntly } = createNuntlyClient(cmd);
      if (opts.all) {
        const page = await withSpinner('Loading...', () =>
          nuntly.contactProperties.list({ cursor: opts.cursor, limit: opts.limit ? Number(opts.limit) : undefined }),
        );
        const all = [] as typeof page.data;
        for await (const item of page) all.push(item);
        printResult({ data: all, nextCursor: null }, opts);
      } else {
        const page = await withSpinner('Loading...', () =>
          nuntly.contactProperties.list({ cursor: opts.cursor, limit: opts.limit ? Number(opts.limit) : undefined }),
        );
        printResult({ data: page.data, nextCursor: page.nextCursor }, opts);
      }
    } catch (error) {
      printError(error, opts);
    }
  });

contactPropertiesCommand
  .command('retrieve')
  .description('Retrieve one contact property.')
  .argument('<contact-property-id>', 'The contactPropertyId')
  .option('--format <fmt>', 'Output format: json, raw, yaml, csv, markdown, table, quiet', parseFormat)
  .option('-q, --quiet', 'Shorthand for --format quiet')
  .option('--raw', 'Shorthand for --format raw')
  .option('--fields <fields>', 'Comma-separated list of fields to display')
  .option('--no-header', 'Omit column headers in table/csv output')
  .addHelpText('after', '\nExample:\n  $ nuntly contact-properties retrieve ctpd_01kabn43yqyxn2bx4ve84mczd3')
  .action(async (contactPropertyId, opts, cmd) => {
    try {
      const { nuntly } = createNuntlyClient(cmd);
      const result = await withSpinner('Loading...', () => nuntly.contactProperties.retrieve(contactPropertyId));
      printResult(result, opts);
    } catch (error) {
      printError(error, opts);
    }
  });

contactPropertiesCommand
  .command('update')
  .description('Update a contact property.')
  .argument('<contact-property-id>', 'The contactPropertyId')
  .option('--description <value>', 'An optional description of the property. (null to clear)')
  .option(
    '--default-value <value>',
    'defaultValue (a numeric value is sent as a number; wrap it in JSON quotes to send it as text) (null to clear)',
  )
  .option('--file <path>', 'Read JSON body from file (use - for stdin)')
  .option('--format <fmt>', 'Output format: json, raw, yaml, csv, markdown, table, quiet', parseFormat)
  .option('-q, --quiet', 'Shorthand for --format quiet')
  .option('--raw', 'Shorthand for --format raw')
  .option('--fields <fields>', 'Comma-separated list of fields to display')
  .option('--no-header', 'Omit column headers in table/csv output')
  .addHelpText(
    'after',
    '\nExample:\n  $ nuntly contact-properties update ctpd_01kabn43yqyxn2bx4ve84mczd3 --description "The plan the customer is on."\n  $ cat payload.json | nuntly contact-properties update ctpd_01kabn43yqyxn2bx4ve84mczd3 --file -\n  $ nuntly contact-properties update ctpd_01kabn43yqyxn2bx4ve84mczd3 --file payload.json',
  )
  .action(async (contactPropertyId, opts, cmd) => {
    try {
      const { nuntly } = createNuntlyClient(cmd);
      const body = resolveBody(opts.file, {
        description: nullable(opts.description),
        defaultValue: opts.defaultValue === 'null' ? null : stringOrNumber(opts.defaultValue),
      });
      const result = await withSpinner('Updating...', () =>
        nuntly.contactProperties.update(contactPropertyId, body as UpdateContactPropertyRequest),
      );
      printResult(result, opts);
    } catch (error) {
      printError(error, opts);
    }
  });
