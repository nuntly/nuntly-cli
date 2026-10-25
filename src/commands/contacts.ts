import { Command, Option } from '@commander-js/extra-typings';
import type { CreateContactRequest, SetContactTopicMembershipRequest, UpdateContactRequest } from '@nuntly/sdk';
import { confirmAction, createNuntlyClient } from '../auth.js';
import { resolveBody } from '../files.js';
import { parseFormat, printError, printResult } from '../output.js';
import { withSpinner } from '../spinner.js';

export const contactsCommand = new Command('contacts').description('Contacts resource.');

const segmentsSub = new Command('segments');
contactsCommand.addCommand(segmentsSub);

segmentsSub
  .command('add')
  .description('Add a contact to a segment. Idempotent.')
  .argument('<contact-id>', 'The contactId')
  .argument('<segment-id>', 'The segmentId')
  .option('--format <fmt>', 'Output format: json, raw, yaml, csv, markdown, table, quiet', parseFormat)
  .option('-q, --quiet', 'Shorthand for --format quiet')
  .option('--raw', 'Shorthand for --format raw')
  .option('--fields <fields>', 'Comma-separated list of fields to display')
  .option('--no-header', 'Omit column headers in table/csv output')
  .addHelpText(
    'after',
    '\nExample:\n  $ nuntly contacts segments add ct_01kabn43yqyxn2bx4ve84mczd3 seg_01kabn43yqyxn2bx4ve84mczd3',
  )
  .action(async (contactId, segmentId, opts, cmd) => {
    try {
      const { nuntly } = createNuntlyClient(cmd);
      const result = await withSpinner('Creating...', () => nuntly.contacts.segments.add(contactId, segmentId));
      printResult(result, opts);
    } catch (error) {
      printError(error, opts);
    }
  });

segmentsSub
  .command('list')
  .description("List a contact's segments.")
  .argument('<contact-id>', 'The contactId')
  .option('--format <fmt>', 'Output format: json, raw, yaml, csv, markdown, table, quiet', parseFormat)
  .option('-q, --quiet', 'Shorthand for --format quiet')
  .option('--raw', 'Shorthand for --format raw')
  .option('--fields <fields>', 'Comma-separated list of fields to display')
  .option('--no-header', 'Omit column headers in table/csv output')
  .addHelpText('after', '\nExample:\n  $ nuntly contacts segments list ct_01kabn43yqyxn2bx4ve84mczd3')
  .action(async (contactId, opts, cmd) => {
    try {
      const { nuntly } = createNuntlyClient(cmd);
      const result = await withSpinner('Loading...', () => nuntly.contacts.segments.list(contactId));
      printResult(result, opts);
    } catch (error) {
      printError(error, opts);
    }
  });

segmentsSub
  .command('remove')
  .description('Remove a contact from a segment.')
  .argument('<contact-id>', 'The contactId')
  .argument('<segment-id>', 'The segmentId')
  .option('--format <fmt>', 'Output format: json, raw, yaml, csv, markdown, table, quiet', parseFormat)
  .option('-q, --quiet', 'Shorthand for --format quiet')
  .option('--raw', 'Shorthand for --format raw')
  .option('--fields <fields>', 'Comma-separated list of fields to display')
  .option('--no-header', 'Omit column headers in table/csv output')
  .addHelpText(
    'after',
    '\nExample:\n  $ nuntly contacts segments remove ct_01kabn43yqyxn2bx4ve84mczd3 seg_01kabn43yqyxn2bx4ve84mczd3',
  )
  .action(async (contactId, segmentId, opts, cmd) => {
    try {
      const { nuntly, globals } = createNuntlyClient(cmd);
      if (!(await confirmAction('delete', 'contact segment', contactId, !!globals.yes))) return;
      const result = await withSpinner('Deleting...', () => nuntly.contacts.segments.remove(contactId, segmentId));
      printResult(result, opts);
    } catch (error) {
      printError(error, opts);
    }
  });

segmentsSub
  .command('retrieve')
  .description('Check if a contact is in a segment.')
  .argument('<contact-id>', 'The contactId')
  .argument('<segment-id>', 'The segmentId')
  .option('--format <fmt>', 'Output format: json, raw, yaml, csv, markdown, table, quiet', parseFormat)
  .option('-q, --quiet', 'Shorthand for --format quiet')
  .option('--raw', 'Shorthand for --format raw')
  .option('--fields <fields>', 'Comma-separated list of fields to display')
  .option('--no-header', 'Omit column headers in table/csv output')
  .addHelpText(
    'after',
    '\nExample:\n  $ nuntly contacts segments retrieve ct_01kabn43yqyxn2bx4ve84mczd3 seg_01kabn43yqyxn2bx4ve84mczd3',
  )
  .action(async (contactId, segmentId, opts, cmd) => {
    try {
      const { nuntly } = createNuntlyClient(cmd);
      const result = await withSpinner('Loading...', () => nuntly.contacts.segments.retrieve(contactId, segmentId));
      printResult(result, opts);
    } catch (error) {
      printError(error, opts);
    }
  });

const topicsSub = new Command('topics');
contactsCommand.addCommand(topicsSub);

topicsSub
  .command('list')
  .description("List a contact's subscription state per topic.")
  .argument('<contact-id>', 'The contactId')
  .option('--format <fmt>', 'Output format: json, raw, yaml, csv, markdown, table, quiet', parseFormat)
  .option('-q, --quiet', 'Shorthand for --format quiet')
  .option('--raw', 'Shorthand for --format raw')
  .option('--fields <fields>', 'Comma-separated list of fields to display')
  .option('--no-header', 'Omit column headers in table/csv output')
  .addHelpText('after', '\nExample:\n  $ nuntly contacts topics list ct_01kabn43yqyxn2bx4ve84mczd3')
  .action(async (contactId, opts, cmd) => {
    try {
      const { nuntly } = createNuntlyClient(cmd);
      const result = await withSpinner('Loading...', () => nuntly.contacts.topics.list(contactId));
      printResult(result, opts);
    } catch (error) {
      printError(error, opts);
    }
  });

topicsSub
  .command('update')
  .description('Subscribe or unsubscribe a contact from a topic.')
  .argument('<contact-id>', 'The contactId')
  .argument('<topic-id>', 'The topicId')
  .addOption(
    new Option('--state <value>', 'The subscribe/unsubscribe state. (required)').choices([
      'subscribed',
      'unsubscribed',
    ] as const),
  )
  .option('--file <path>', 'Read JSON body from file (use - for stdin)')
  .option('--format <fmt>', 'Output format: json, raw, yaml, csv, markdown, table, quiet', parseFormat)
  .option('-q, --quiet', 'Shorthand for --format quiet')
  .option('--raw', 'Shorthand for --format raw')
  .option('--fields <fields>', 'Comma-separated list of fields to display')
  .option('--no-header', 'Omit column headers in table/csv output')
  .addHelpText(
    'after',
    '\nExample:\n  $ nuntly contacts topics update ct_01kabn43yqyxn2bx4ve84mczd3 tpc_01kabn43yqyxn2bx4ve84mczd3 --state subscribed\n  $ cat payload.json | nuntly contacts topics update ct_01kabn43yqyxn2bx4ve84mczd3 tpc_01kabn43yqyxn2bx4ve84mczd3 --file -\n  $ nuntly contacts topics update ct_01kabn43yqyxn2bx4ve84mczd3 tpc_01kabn43yqyxn2bx4ve84mczd3 --file payload.json',
  )
  .action(async (contactId, topicId, opts, cmd) => {
    try {
      const { nuntly } = createNuntlyClient(cmd);
      const body = resolveBody(opts.file, {
        state: opts.state,
      });
      const result = await withSpinner('Updating...', () =>
        nuntly.contacts.topics.update(contactId, topicId, body as SetContactTopicMembershipRequest),
      );
      printResult(result, opts);
    } catch (error) {
      printError(error, opts);
    }
  });

contactsCommand
  .command('create')
  .description('Create a contact.')
  .option('--email <value>', 'The contact email address. Stored lowercased and trimmed. (required)')
  .option('--properties <value>', 'Contact properties keyed by name. A null value means not supplied.')
  .option('--file <path>', 'Read JSON body from file (use - for stdin)')
  .option('--format <fmt>', 'Output format: json, raw, yaml, csv, markdown, table, quiet', parseFormat)
  .option('-q, --quiet', 'Shorthand for --format quiet')
  .option('--raw', 'Shorthand for --format raw')
  .option('--fields <fields>', 'Comma-separated list of fields to display')
  .option('--no-header', 'Omit column headers in table/csv output')
  .addHelpText(
    'after',
    '\nExample:\n  $ nuntly contacts create --email jane@example.com\n  $ cat payload.json | nuntly contacts create --file -\n  $ nuntly contacts create --file payload.json',
  )
  .action(async (opts, cmd) => {
    try {
      const { nuntly } = createNuntlyClient(cmd);
      const body = resolveBody(opts.file, {
        email: opts.email,
        properties: opts.properties != null ? JSON.parse(opts.properties as string) : undefined,
      });
      const result = await withSpinner('Creating...', () => nuntly.contacts.create(body as CreateContactRequest));
      printResult(result, opts);
    } catch (error) {
      printError(error, opts);
    }
  });

contactsCommand
  .command('delete')
  .description('Delete a contact.')
  .argument('<contact-id>', 'The contactId')
  .option('--format <fmt>', 'Output format: json, raw, yaml, csv, markdown, table, quiet', parseFormat)
  .option('-q, --quiet', 'Shorthand for --format quiet')
  .option('--raw', 'Shorthand for --format raw')
  .option('--fields <fields>', 'Comma-separated list of fields to display')
  .option('--no-header', 'Omit column headers in table/csv output')
  .addHelpText('after', '\nExample:\n  $ nuntly contacts delete ct_01kabn43yqyxn2bx4ve84mczd3')
  .action(async (contactId, opts, cmd) => {
    try {
      const { nuntly, globals } = createNuntlyClient(cmd);
      if (!(await confirmAction('delete', 'contact', contactId, !!globals.yes))) return;
      const result = await withSpinner('Deleting...', () => nuntly.contacts.delete(contactId));
      printResult(result, opts);
    } catch (error) {
      printError(error, opts);
    }
  });

contactsCommand
  .command('list')
  .description('List the organization contacts.')
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
    "\nExample:\n  $ nuntly contacts list\n  $ nuntly contacts list --format json | jq '.data[].id'",
  )
  .action(async (opts, cmd) => {
    try {
      const { nuntly } = createNuntlyClient(cmd);
      if (opts.all) {
        const page = await withSpinner('Loading...', () =>
          nuntly.contacts.list({ cursor: opts.cursor, limit: opts.limit ? Number(opts.limit) : undefined }),
        );
        const all = [] as typeof page.data;
        for await (const item of page) all.push(item);
        printResult({ data: all, nextCursor: null }, opts);
      } else {
        const page = await withSpinner('Loading...', () =>
          nuntly.contacts.list({ cursor: opts.cursor, limit: opts.limit ? Number(opts.limit) : undefined }),
        );
        printResult({ data: page.data, nextCursor: page.nextCursor }, opts);
      }
    } catch (error) {
      printError(error, opts);
    }
  });

contactsCommand
  .command('retrieve')
  .description('Retrieve one contact.')
  .argument('<contact-id>', 'The contactId')
  .option('--format <fmt>', 'Output format: json, raw, yaml, csv, markdown, table, quiet', parseFormat)
  .option('-q, --quiet', 'Shorthand for --format quiet')
  .option('--raw', 'Shorthand for --format raw')
  .option('--fields <fields>', 'Comma-separated list of fields to display')
  .option('--no-header', 'Omit column headers in table/csv output')
  .addHelpText('after', '\nExample:\n  $ nuntly contacts retrieve ct_01kabn43yqyxn2bx4ve84mczd3')
  .action(async (contactId, opts, cmd) => {
    try {
      const { nuntly } = createNuntlyClient(cmd);
      const result = await withSpinner('Loading...', () => nuntly.contacts.retrieve(contactId));
      printResult(result, opts);
    } catch (error) {
      printError(error, opts);
    }
  });

contactsCommand
  .command('update')
  .description("Update a contact's properties.")
  .argument('<contact-id>', 'The contactId')
  .option(
    '--email <value>',
    "The contact's current address, in any letter case. The address cannot be changed: a different address is refused with the error code contact_email_immutable.",
  )
  .option(
    '--properties <value>',
    'Contact properties keyed by name, matched exactly. A null value removes the property.',
  )
  .option('--file <path>', 'Read JSON body from file (use - for stdin)')
  .option('--format <fmt>', 'Output format: json, raw, yaml, csv, markdown, table, quiet', parseFormat)
  .option('-q, --quiet', 'Shorthand for --format quiet')
  .option('--raw', 'Shorthand for --format raw')
  .option('--fields <fields>', 'Comma-separated list of fields to display')
  .option('--no-header', 'Omit column headers in table/csv output')
  .addHelpText(
    'after',
    '\nExample:\n  $ nuntly contacts update ct_01kabn43yqyxn2bx4ve84mczd3 --properties \'{"plan":"pro"}\'\n  $ cat payload.json | nuntly contacts update ct_01kabn43yqyxn2bx4ve84mczd3 --file -\n  $ nuntly contacts update ct_01kabn43yqyxn2bx4ve84mczd3 --file payload.json',
  )
  .action(async (contactId, opts, cmd) => {
    try {
      const { nuntly } = createNuntlyClient(cmd);
      const body = resolveBody(opts.file, {
        email: opts.email,
        properties: opts.properties != null ? JSON.parse(opts.properties as string) : undefined,
      });
      const result = await withSpinner('Updating...', () =>
        nuntly.contacts.update(contactId, body as UpdateContactRequest),
      );
      printResult(result, opts);
    } catch (error) {
      printError(error, opts);
    }
  });
