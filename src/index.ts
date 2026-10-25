#!/usr/bin/env node
import { Command } from '@commander-js/extra-typings';
import pc from 'picocolors';
import { agentsCommand } from './commands/agents.js';
import { apiKeysCommand } from './commands/api-keys.js';
import { broadcastsCommand } from './commands/broadcasts.js';
import { contactPropertiesCommand } from './commands/contact-properties.js';
import { contactsCommand } from './commands/contacts.js';
import { domainsCommand } from './commands/domains.js';
import { emailsCommand } from './commands/emails.js';
import { inboxesCommand } from './commands/inboxes.js';
import { messagesCommand } from './commands/messages.js';
import { namespacesCommand } from './commands/namespaces.js';
import { organizationsCommand } from './commands/organizations.js';
import { segmentsCommand } from './commands/segments.js';
import { templatesCommand } from './commands/templates.js';
import { threadsCommand } from './commands/threads.js';
import { topicsCommand } from './commands/topics.js';
import { webhooksCommand } from './commands/webhooks.js';
import { CLI_VERSION } from './version.js';

const program = new Command()
  .name('nuntly')
  .description(pc.bold('Nuntly CLI') + ' - Developer-first email platform')
  .version(CLI_VERSION)
  .option('--profile <name>', 'Use a specific profile from ~/.nuntly/config.json')
  .option('--api-key <key>', 'API key (overrides NUNTLY_API_KEY env var and profile)')
  .option('-y, --yes', 'Skip interactive confirmation prompts (e.g. for delete)');

import { listProfiles, login } from './auth.js';
import { bashCompletion, fishCompletion, powershellCompletion, zshCompletion } from './completion.js';

program
  .command('login')
  .description('Save your API key to ~/.nuntly/config.json')
  .argument('[profile]', 'Profile name (default: "default")')
  .option('--with-token', 'Read the API key from stdin instead of prompting')
  .action(async (profile, opts) => {
    await login(profile, opts.withToken);
  });

program
  .command('profiles')
  .description('List configured profiles')
  .action(() => {
    const profiles = listProfiles();
    if (profiles.length === 0) console.log(pc.dim('No profiles configured. Run: nuntly login'));
    else for (const n of profiles) console.log(n);
  });

program
  .command('completion')
  .description('Output shell completion script')
  .argument('<shell>', 'Shell type: bash, zsh, fish, or powershell')
  .action((shell) => {
    switch (shell) {
      case 'bash':
        console.log(bashCompletion());
        break;
      case 'zsh':
        console.log(zshCompletion());
        break;
      case 'fish':
        console.log(fishCompletion());
        break;
      case 'powershell':
        console.log(powershellCompletion());
        break;
      default:
        console.error(pc.red('Unknown shell: ' + shell));
        process.exit(2);
    }
  });

program.addCommand(agentsCommand);
program.addCommand(apiKeysCommand);
program.addCommand(broadcastsCommand);
program.addCommand(contactPropertiesCommand);
program.addCommand(contactsCommand);
program.addCommand(domainsCommand);
program.addCommand(emailsCommand);
program.addCommand(inboxesCommand);
program.addCommand(messagesCommand);
program.addCommand(namespacesCommand);
program.addCommand(organizationsCommand);
program.addCommand(segmentsCommand);
program.addCommand(templatesCommand);
program.addCommand(threadsCommand);
program.addCommand(topicsCommand);
program.addCommand(webhooksCommand);

function applyExitOverride(cmd: Command) {
  cmd.exitOverride((err) => {
    if (err.code === 'commander.help' || err.code === 'commander.helpDisplayed' || err.code === 'commander.version')
      process.exit(0);
    process.exit(2);
  });
  for (const c of cmd.commands) applyExitOverride(c as Command);
}
applyExitOverride(program);

program.parse();
