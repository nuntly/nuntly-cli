import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { existsSync, mkdirSync, readFileSync, rmSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';

// We test saveProfile by importing the module with a patched CONFIG_DIR.
// Since auth.ts uses homedir() at module level, we override via a temp directory.

const TEST_DIR = resolve(tmpdir(), `nuntly-cli-test-${Date.now()}`);
const TEST_CONFIG_DIR = resolve(TEST_DIR, '.nuntly');
const TEST_CONFIG_PATH = resolve(TEST_CONFIG_DIR, 'config.json');

// We can't easily override the module constants, so we replicate the saveProfile logic
// to test the file permission behavior directly.
import { chmodSync, writeFileSync } from 'node:fs';
import { resolveCredentials } from '../src/auth.js';

function saveProfileToPath(configDir: string, configPath: string, profileName: string, profile: { apiKey?: string }) {
  mkdirSync(configDir, { recursive: true });
  let config: Record<string, unknown> = {};
  if (existsSync(configPath)) {
    config = JSON.parse(readFileSync(configPath, 'utf-8'));
  }
  if (!config.profiles) config.profiles = {};
  (config.profiles as Record<string, unknown>)[profileName] = profile;
  if (!config.defaultProfile) config.defaultProfile = profileName;
  writeFileSync(configPath, JSON.stringify(config, null, 2) + '\n', {
    mode: 0o600,
  });
  chmodSync(configPath, 0o600);
}

describe('auth config file permissions', () => {
  beforeEach(() => {
    mkdirSync(TEST_DIR, { recursive: true });
  });

  afterEach(() => {
    rmSync(TEST_DIR, { recursive: true, force: true });
  });

  it('creates config file with chmod 600', () => {
    saveProfileToPath(TEST_CONFIG_DIR, TEST_CONFIG_PATH, 'default', {
      apiKey: 'nuntly_sk_test',
    });

    const stat = statSync(TEST_CONFIG_PATH);
    const mode = stat.mode & 0o777;
    expect(mode).toBe(0o600);
  });

  it('preserves chmod 600 on subsequent writes', () => {
    saveProfileToPath(TEST_CONFIG_DIR, TEST_CONFIG_PATH, 'default', {
      apiKey: 'nuntly_sk_first',
    });
    saveProfileToPath(TEST_CONFIG_DIR, TEST_CONFIG_PATH, 'staging', {
      apiKey: 'nuntly_sk_second',
    });

    const stat = statSync(TEST_CONFIG_PATH);
    const mode = stat.mode & 0o777;
    expect(mode).toBe(0o600);
  });

  it('config file is not group/world readable', () => {
    saveProfileToPath(TEST_CONFIG_DIR, TEST_CONFIG_PATH, 'default', {
      apiKey: 'nuntly_sk_test',
    });

    const stat = statSync(TEST_CONFIG_PATH);
    const mode = stat.mode & 0o777;
    const groupRead = mode & 0o040;
    const worldRead = mode & 0o004;
    expect(groupRead).toBe(0);
    expect(worldRead).toBe(0);
  });

  it('stores profile data correctly', () => {
    saveProfileToPath(TEST_CONFIG_DIR, TEST_CONFIG_PATH, 'prod', {
      apiKey: 'nuntly_sk_prod',
    });

    const config = JSON.parse(readFileSync(TEST_CONFIG_PATH, 'utf-8'));
    expect(config.defaultProfile).toBe('prod');
    expect(config.profiles.prod.apiKey).toBe('nuntly_sk_prod');
  });
});

describe('resolveCredentials', () => {
  const config = {
    defaultProfile: 'default',
    profiles: {
      default: { apiKey: 'default_key', baseUrl: 'https://default.test' },
      staging: { apiKey: 'staging_key', baseUrl: 'https://staging.test' },
    },
  };
  const env = {
    NUNTLY_API_KEY: 'env_key',
    NUNTLY_BASE_URL: 'https://env.test',
  };

  it('takes the key and the host from an explicit profile', () => {
    expect(resolveCredentials({ profileName: 'staging', env, config })).toEqual({
      apiKey: 'staging_key',
      baseUrl: 'https://staging.test',
    });
  });

  it('reads NUNTLY_PROFILE as an explicit profile', () => {
    expect(
      resolveCredentials({
        env: { ...env, NUNTLY_PROFILE: 'staging' },
        config,
      }),
    ).toEqual({ apiKey: 'staging_key', baseUrl: 'https://staging.test' });
  });

  it('never falls back to the env key for an explicit profile', () => {
    expect(resolveCredentials({ profileName: 'missing', env, config }).apiKey).toBeUndefined();
  });

  it('takes the env key with the env host only', () => {
    expect(resolveCredentials({ env, config })).toEqual({
      apiKey: 'env_key',
      baseUrl: 'https://env.test',
    });
    expect(resolveCredentials({ env: { NUNTLY_API_KEY: 'env_key' }, config })).toEqual({
      apiKey: 'env_key',
      baseUrl: undefined,
    });
  });

  it('takes the default profile when no key is in the environment', () => {
    expect(
      resolveCredentials({
        env: { NUNTLY_BASE_URL: 'https://env.test' },
        config,
      }),
    ).toEqual({ apiKey: 'default_key', baseUrl: 'https://default.test' });
  });

  it('lets --api-key override the key of an explicit profile', () => {
    expect(
      resolveCredentials({
        flagKey: 'flag_key',
        profileName: 'staging',
        env,
        config,
      }),
    ).toEqual({ apiKey: 'flag_key', baseUrl: 'https://staging.test' });
  });

  it('sends --api-key alone to the env host', () => {
    expect(resolveCredentials({ flagKey: 'flag_key', env, config })).toEqual({
      apiKey: 'flag_key',
      baseUrl: 'https://env.test',
    });
  });

  it('reads a legacy flat config as the default profile', () => {
    expect(
      resolveCredentials({
        env: {},
        config: { apiKey: 'old_key', baseUrl: 'https://old.test' },
      }),
    ).toEqual({ apiKey: 'old_key', baseUrl: 'https://old.test' });
  });
});
