#!/usr/bin/env node
import { Command } from '@commander-js/extra-typings';
import pc from 'picocolors';
import { CLI_VERSION } from './version.js';

import { agentsCommand } from './commands/agents.js';
import { apiKeysCommand } from './commands/api-keys.js';
import { domainsCommand } from './commands/domains.js';
import { emailsCommand } from './commands/emails.js';
import { inboxesCommand } from './commands/inboxes.js';
import { messagesCommand } from './commands/messages.js';
import { namespacesCommand } from './commands/namespaces.js';
import { organizationsCommand } from './commands/organizations.js';
import { threadsCommand } from './commands/threads.js';
import { webhooksCommand } from './commands/webhooks.js';

const program = new Command()
  .name('nuntly')
  .description(pc.bold('Nuntly CLI') + ' - Developer-first email platform')
  .version(CLI_VERSION)
  .option('--profile <name>', 'Use a specific profile from ~/.nuntly/config.json');

import { login, listProfiles } from './auth.js';
import { bashCompletion, zshCompletion, fishCompletion, powershellCompletion } from './completion.js';

program
  .command('login')
  .description('Save your API key to ~/.nuntly/config.json')
  .argument('[profile]', 'Profile name (default: "default")')
  .action(async (profile) => { await login(profile); });

program
  .command('profiles')
  .description('List configured profiles')
  .action(() => {
    const profiles = listProfiles();
    if (profiles.length === 0) console.log(pc.dim('No profiles configured. Run: nuntly login'));
    else profiles.forEach(n => console.log(n));
  });

program
  .command('completion')
  .description('Output shell completion script')
  .argument('<shell>', 'Shell type: bash, zsh, fish, or powershell')
  .action((shell) => {
    switch (shell) {
      case 'bash': console.log(bashCompletion()); break;
      case 'zsh': console.log(zshCompletion()); break;
      case 'fish': console.log(fishCompletion()); break;
      case 'powershell': console.log(powershellCompletion()); break;
      default: console.error(pc.red('Unknown shell: ' + shell)); process.exit(1);
    }
  });

program.addCommand(agentsCommand);
program.addCommand(apiKeysCommand);
program.addCommand(domainsCommand);
program.addCommand(emailsCommand);
program.addCommand(inboxesCommand);
program.addCommand(messagesCommand);
program.addCommand(namespacesCommand);
program.addCommand(organizationsCommand);
program.addCommand(threadsCommand);
program.addCommand(webhooksCommand);

program.parse();
