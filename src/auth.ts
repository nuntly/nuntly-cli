import { execSync } from 'node:child_process';
import { chmodSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { homedir, platform } from 'node:os';
import { resolve } from 'node:path';
import * as p from '@clack/prompts';
import { Nuntly } from '@nuntly/sdk';
import pc from 'picocolors';
import { readStdin } from './files.js';
// Single source of truth lives in output.ts (includes raw + csv). Import for
// local use AND re-export so callers importing it from auth.js keep working.
import type { OutputFormat } from './output.js';
import { CLI_VERSION } from './version.js';

export type { OutputFormat };

export interface ProfileConfig {
  apiKey?: string;
  baseUrl?: string;
  outputFormat?: OutputFormat;
}

export interface NuntlyConfig {
  defaultProfile?: string;
  profiles?: Record<string, ProfileConfig>;
  // Legacy flat fields (migrated to profiles.default on read)
  apiKey?: string;
  baseUrl?: string;
  outputFormat?: OutputFormat;
}

export const CONFIG_DIR = resolve(homedir(), '.nuntly');
export const CONFIG_PATH = resolve(CONFIG_DIR, 'config.json');

function loadRawConfig(): NuntlyConfig {
  if (!existsSync(CONFIG_PATH)) return {};
  try {
    return JSON.parse(readFileSync(CONFIG_PATH, 'utf-8'));
  } catch {
    return {};
  }
}

function resolveProfile(config: NuntlyConfig, profileName?: string): ProfileConfig {
  // Legacy flat config: treat as default profile
  if (!config.profiles && config.apiKey) {
    return {
      apiKey: config.apiKey,
      baseUrl: config.baseUrl,
      outputFormat: config.outputFormat,
    };
  }
  const name = profileName ?? config.defaultProfile ?? 'default';
  return config.profiles?.[name] ?? {};
}

function restrictFilePermissions(filePath: string): void {
  if (platform() === 'win32') {
    try {
      execSync(`icacls "${filePath}" /inheritance:r /grant:r "%USERNAME%:(R,W)" /q`, { stdio: 'ignore' });
    } catch {
      // icacls may not be available in all Windows environments
    }
  } else {
    chmodSync(filePath, 0o600);
  }
}

export function saveProfile(profileName: string, profile: ProfileConfig): void {
  mkdirSync(CONFIG_DIR, { recursive: true });
  const config = loadRawConfig();
  if (!config.profiles) config.profiles = {};
  config.profiles[profileName] = {
    ...config.profiles[profileName],
    ...profile,
  };
  if (!config.defaultProfile) config.defaultProfile = profileName;
  // Remove legacy flat fields
  delete config.apiKey;
  delete config.baseUrl;
  delete config.outputFormat;
  writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2) + '\n', {
    mode: 0o600,
  });
  restrictFilePermissions(CONFIG_PATH);
}

export function listProfiles(): string[] {
  const config = loadRawConfig();
  return Object.keys(config.profiles ?? {});
}

export interface Credentials {
  apiKey?: string;
  baseUrl?: string;
}

// The key and the host come from the same source, so a key never reaches
// another source's host: an explicit profile, else the environment, else the
// default profile. `--api-key` only replaces the key.
export function resolveCredentials({
  flagKey,
  profileName,
  env = process.env,
  config = loadRawConfig(),
}: {
  flagKey?: string;
  profileName?: string;
  env?: Record<string, string | undefined>;
  config?: NuntlyConfig;
}): Credentials {
  const explicit = profileName || env['NUNTLY_PROFILE'];
  if (explicit) {
    const profile = resolveProfile(config, explicit);
    return { apiKey: flagKey ?? profile.apiKey, baseUrl: profile.baseUrl };
  }
  const envKey = env['NUNTLY_API_KEY'];
  if (flagKey || envKey) {
    return { apiKey: flagKey ?? envKey, baseUrl: env['NUNTLY_BASE_URL'] };
  }
  const profile = resolveProfile(config);
  return { apiKey: profile.apiKey, baseUrl: profile.baseUrl };
}

function requireCredentials(flagKey?: string, profileName?: string): Credentials & { apiKey: string } {
  const credentials = resolveCredentials({ flagKey, profileName });
  if (!credentials.apiKey) {
    const profile = profileName || process.env['NUNTLY_PROFILE'];
    console.error(pc.red(profile ? `Error: no API key in profile "${profile}".` : 'Error: API key not found.'));
    console.error(
      profile
        ? `Run ${pc.bold(`nuntly login ${profile}`)}, or use ${pc.bold('--api-key')}`
        : `Run ${pc.bold('nuntly login')}, set ${pc.bold('NUNTLY_API_KEY')} env var, or use ${pc.bold('--api-key')}`,
    );
    process.exit(4);
  }
  if (flagKey) {
    console.error(pc.yellow('Warning: passing API key via flag is less secure than env var.'));
  }
  return { apiKey: credentials.apiKey, baseUrl: credentials.baseUrl };
}

export function resolveOutputFormat(profileName?: string): OutputFormat | undefined {
  const config = loadRawConfig();
  const profile = resolveProfile(config, profileName);
  return profile.outputFormat;
}

export interface GlobalFlags {
  apiKey?: string;
  yes?: boolean;
  profile?: string;
}

export function createNuntlyClient(cmd: { optsWithGlobals(): unknown }): {
  nuntly: Nuntly;
  globals: GlobalFlags;
} {
  const globals = cmd.optsWithGlobals() as GlobalFlags;
  const { apiKey, baseUrl } = requireCredentials(globals.apiKey, globals.profile);
  const nuntly = new Nuntly({
    apiKey,
    baseUrl,
    appInfo: { name: '@nuntly/cli', version: CLI_VERSION },
  });
  return { nuntly, globals };
}

export async function login(profileName?: string, withToken = false): Promise<void> {
  const name = profileName ?? 'default';
  if (withToken) {
    const apiKey = readStdin().trim();
    if (!apiKey) {
      console.error(pc.red('Error: no API key on stdin.'));
      process.exit(2);
    }
    saveProfile(name, { apiKey });
    console.error(`Profile "${name}" saved to ${CONFIG_PATH}`);
    return;
  }
  p.intro(pc.bold(`Nuntly Login${name !== 'default' ? ` (profile: ${name})` : ''}`));

  const apiKey = await p.password({
    message: 'Enter your API key',
    validate: (value) => {
      if (!value || value.trim().length === 0) return 'API key is required';
      return undefined;
    },
  });

  if (p.isCancel(apiKey)) {
    p.cancel('Login cancelled.');
    process.exit(0);
  }

  const baseUrl = await p.text({
    message: 'API base URL (leave empty for default)',
    placeholder: 'https://api.nuntly.com',
  });

  if (p.isCancel(baseUrl)) {
    p.cancel('Login cancelled.');
    process.exit(0);
  }

  const profile: ProfileConfig = { apiKey: apiKey.trim() };
  if (baseUrl && baseUrl.trim()) profile.baseUrl = baseUrl.trim();

  saveProfile(name, profile);

  p.note(`Profile "${name}" saved to ${pc.dim(CONFIG_PATH)}`, 'Saved');
  p.outro(pc.green('Logged in successfully.'));
}

export async function confirmAction(verb: string, resource: string, id: string, skipPrompt = false): Promise<boolean> {
  // Bypass the interactive prompt when `--yes` was passed or when stdin is
  // not a TTY (CI/scripts). In the non-TTY case @clack/prompts would either
  // hang or fail, so we treat absence of `--yes` as a refusal so scripts
  // don't accidentally delete or send.
  if (skipPrompt) return true;
  if (!process.stdin.isTTY) {
    console.error(pc.red(`Error: refusing to ${verb} ${resource} ${pc.bold(id)} without a TTY.`));
    console.error(`Pass ${pc.bold('--yes')} (or ${pc.bold('-y')}) to confirm.`);
    // Usage error in a non-interactive context: exit non-zero so a CI script
    // (`nuntly ... delete X && ...`) halts instead of silently succeeding
    // while nothing happened.
    process.exit(2);
  }
  const result = await p.confirm({
    message: `${verb.charAt(0).toUpperCase()}${verb.slice(1)} ${resource} ${pc.bold(id)}?`,
  });
  if (p.isCancel(result)) return false;
  return result;
}
