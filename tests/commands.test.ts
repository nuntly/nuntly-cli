import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'bun:test';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import type { Server } from 'bun';

// Runs the real CLI in a child process so stdin, TTY detection and exit codes
// behave as they do for an agent or a CI job.
const ENTRY = resolve(import.meta.dir, '../src/index.ts');

interface Captured {
  method: string;
  url: URL;
  body: unknown;
  authorization: string | null;
}

let server: Server;
let requests: Captured[];
let reply: { status: number; body: unknown };

beforeAll(() => {
  server = Bun.serve({
    port: 0,
    async fetch(req) {
      const text = await req.text();
      requests.push({
        method: req.method,
        url: new URL(req.url),
        body: text ? JSON.parse(text) : undefined,
        authorization: req.headers.get('authorization'),
      });
      return Response.json(reply.body, {
        status: reply.status,
        headers: { 'x-request-id': 'req_123' },
      });
    },
  });
});

afterAll(() => server.stop(true));

beforeEach(() => {
  requests = [];
  reply = { status: 200, body: { data: { id: 'bc_1' } } };
});

async function run(
  args: string[],
  options: {
    stdin?: string | 'open';
    baseUrl?: string;
    env?: Record<string, string | undefined>;
  } = {},
) {
  const proc = Bun.spawn(['bun', ENTRY, ...args], {
    env: {
      ...process.env,
      NUNTLY_API_KEY: 'test_key',
      NUNTLY_BASE_URL: options.baseUrl ?? server.url.origin,
      ...options.env,
    },
    stdin: options.stdin === 'open' ? 'pipe' : options.stdin !== undefined ? new Blob([options.stdin]) : 'ignore',
    stdout: 'pipe',
    stderr: 'pipe',
  });
  const [stdout, stderr, exitCode] = await Promise.all([
    new Response(proc.stdout).text(),
    new Response(proc.stderr).text(),
    proc.exited,
  ]);
  return { stdout, stderr, exitCode };
}

describe('body input', () => {
  it('sends the body flags when stdin is not a terminal and empty', async () => {
    const { exitCode } = await run(['broadcasts', 'update', 'bc_1', '--name', 'October newsletter']);
    expect(exitCode).toBe(0);
    expect(requests[0].body).toEqual({ name: 'October newsletter' });
  });

  it('does not wait on an open stdin when body flags are given', async () => {
    const { exitCode } = await run(['broadcasts', 'update', 'bc_1', '--name', 'October newsletter'], { stdin: 'open' });
    expect(exitCode).toBe(0);
    expect(requests[0].body).toEqual({ name: 'October newsletter' });
  });

  it('reads stdin with --file -', async () => {
    const { exitCode } = await run(['broadcasts', 'update', 'bc_1', '--file', '-'], {
      stdin: JSON.stringify({ subject: 'Big news' }),
    });
    expect(exitCode).toBe(0);
    expect(requests[0].body).toEqual({ subject: 'Big news' });
  });

  it('refuses --file combined with a body flag before any request', async () => {
    const { exitCode, stderr } = await run(['broadcasts', 'update', 'bc_1', '--file', '-', '--name', 'October'], {
      stdin: JSON.stringify({ subject: 'Big news' }),
    });
    expect(exitCode).toBe(2);
    expect(stderr).toContain('--file cannot be combined with --name');
    expect(requests).toHaveLength(0);
  });

  it('names every body flag given with --file', async () => {
    const { exitCode, stderr } = await run(
      ['domains', 'create', '--file', '-', '--name', 'acme.com', '--no-sending', '--receiving'],
      { stdin: JSON.stringify({ name: 'acme.com' }) },
    );
    expect(exitCode).toBe(2);
    expect(stderr).toContain('--file cannot be combined with --name, --no-sending, --receiving');
    expect(requests).toHaveLength(0);
  });

  it('ignores piped stdin without --file -', async () => {
    const { exitCode } = await run(['broadcasts', 'update', 'bc_1'], {
      stdin: JSON.stringify({ subject: 'Big news' }),
    });
    expect(exitCode).toBe(0);
    expect(requests[0].body).toEqual({});
  });

  it('sends at once on an open stdin with no body flag', async () => {
    const { exitCode } = await run(['--yes', 'broadcasts', 'send', 'bc_1'], {
      stdin: 'open',
    });
    expect(exitCode).toBe(0);
    expect(requests).toHaveLength(1);
  });

  it('leaves the ids of a while read loop to the loop', async () => {
    const proc = Bun.spawn(
      ['sh', '-c', 'printf "bc_1\\nbc_2\\nbc_3\\n" | while read id; do bun "$ENTRY" --yes broadcasts send "$id"; done'],
      {
        env: {
          ...process.env,
          ENTRY,
          NUNTLY_API_KEY: 'test_key',
          NUNTLY_BASE_URL: server.url.origin,
        },
        stdout: 'ignore',
        stderr: 'ignore',
      },
    );
    expect(await proc.exited).toBe(0);
    expect(requests.map((r) => r.url.pathname)).toEqual([
      '/broadcasts/bc_1/send',
      '/broadcasts/bc_2/send',
      '/broadcasts/bc_3/send',
    ]);
  });
});

describe('nullable fields', () => {
  it('sends null for a nullable flag given the literal null', async () => {
    const { exitCode } = await run(['broadcasts', 'update', 'bc_1', '--template-id', 'null']);
    expect(exitCode).toBe(0);
    expect(requests[0].body).toEqual({ templateId: null });
  });

  it('sends null for a nullable repeatable flag given the literal null', async () => {
    const { exitCode } = await run(['broadcasts', 'update', 'bc_1', '--reply-to', 'null']);
    expect(exitCode).toBe(0);
    expect(requests[0].body).toEqual({ replyTo: null });
  });

  it('keeps any other value as a string', async () => {
    await run(['broadcasts', 'update', 'bc_1', '--template-id', 'tpl_1']);
    expect(requests[0].body).toEqual({ templateId: 'tpl_1' });
  });
});

describe('enum flags', () => {
  it('refuses a value outside the enum before any request', async () => {
    const { exitCode, stderr } = await run(['webhooks', 'update', 'wh_1', '--status', 'paused']);
    expect(exitCode).toBe(2);
    expect(stderr).toContain('Allowed choices are enabled, disabled.');
    expect(requests).toHaveLength(0);
  });

  it('refuses an unknown item in a comma-separated enum flag', async () => {
    const { exitCode } = await run(['webhooks', 'update', 'wh_1', '--events', 'email.sent,email.lost']);
    expect(exitCode).toBe(2);
    expect(requests).toHaveLength(0);
  });

  it('sends valid enum values', async () => {
    const { exitCode } = await run([
      'webhooks',
      'update',
      'wh_1',
      '--status',
      'disabled',
      '--events',
      'email.sent,email.delivered',
    ]);
    expect(exitCode).toBe(0);
    expect(requests[0].body).toEqual({
      status: 'disabled',
      events: ['email.sent', 'email.delivered'],
    });
  });

  it('shows a real enum value in the help example', async () => {
    const { stdout } = await run(['contact-properties', 'create', '--help']);
    expect(stdout).toContain('--type string');
    expect(stdout).not.toContain('--type "value"');
  });
});

describe('threads retrieve --mark-read', () => {
  it('is a switch and refuses the former value form', async () => {
    const { exitCode } = await run(['threads', 'retrieve', 'th_1', '--mark-read', 'true']);
    expect(exitCode).toBe(2);
    expect(requests).toHaveLength(0);
  });
});

describe('contact property default value', () => {
  it('sends a numeric --default-value as a number', async () => {
    const { exitCode } = await run([
      'contact-properties',
      'create',
      '--name',
      'seats',
      '--type',
      'number',
      '--default-value',
      '5',
    ]);
    expect(exitCode).toBe(0);
    expect(requests[0].body).toEqual({
      name: 'seats',
      type: 'number',
      defaultValue: 5,
    });
  });

  it('sends text and a JSON-quoted number as strings', async () => {
    await run(['contact-properties', 'update', 'cp_1', '--default-value', 'free']);
    await run(['contact-properties', 'update', 'cp_1', '--default-value', '"75001"']);
    expect(requests.map((r) => r.body)).toEqual([{ defaultValue: 'free' }, { defaultValue: '75001' }]);
  });

  it('clears the default with null', async () => {
    await run(['contact-properties', 'update', 'cp_1', '--default-value', 'null']);
    expect(requests[0].body).toEqual({ defaultValue: null });
  });
});

describe('list output', () => {
  it('prints a null nextCursor when the last page leaves it out', async () => {
    reply = { status: 200, body: { data: [{ id: 'em_1' }] } };
    const { exitCode, stdout } = await run(['emails', 'list', '--format', 'json']);
    expect(exitCode).toBe(0);
    expect(JSON.parse(stdout)).toStrictEqual({ data: [{ id: 'em_1' }], nextCursor: null });
  });
});

describe('API errors', () => {
  const validation = {
    status: 422,
    body: {
      error: {
        status: 422,
        code: 'invalid_body',
        title: 'The body is invalid',
        details: "The field 'name' is invalid or missing.",
      },
    },
  };

  it('writes the API code and details in the JSON error envelope', async () => {
    reply = validation;
    const { exitCode, stderr } = await run(['broadcasts', 'update', 'bc_1', '--name', 'x', '--format', 'json']);
    expect(exitCode).toBe(1);
    expect(JSON.parse(stderr)).toEqual({
      error: {
        status: 422,
        code: 'invalid_body',
        message: 'The body is invalid',
        details: "The field 'name' is invalid or missing.",
        requestId: 'req_123',
      },
    });
  });

  it('prints the API code and details in table output', async () => {
    reply = validation;
    const { stderr } = await run(['broadcasts', 'update', 'bc_1', '--name', 'x', '--format', 'table']);
    expect(stderr).toContain('HTTP 422 invalid_body: The body is invalid');
    expect(stderr).toContain("The field 'name' is invalid or missing.");
    expect(stderr).toContain('request: req_123');
  });
});

describe('broadcasts send confirmation', () => {
  it('refuses to send without a TTY and without --yes', async () => {
    const { exitCode, stderr } = await run(['broadcasts', 'send', 'bc_1']);
    expect(exitCode).toBe(2);
    expect(stderr).toContain('refusing to send broadcast');
    expect(requests).toHaveLength(0);
  });

  it('sends with --yes', async () => {
    const { exitCode } = await run(['--yes', 'broadcasts', 'send', 'bc_1']);
    expect(exitCode).toBe(0);
    expect(requests[0].method).toBe('POST');
    expect(requests[0].url.pathname).toBe('/broadcasts/bc_1/send');
  });
});

describe('exit codes', () => {
  it('exits 3 with a network_error when the API cannot be reached', async () => {
    const { exitCode, stderr } = await run(['broadcasts', 'retrieve', 'bc_1', '--format', 'json'], {
      baseUrl: 'http://127.0.0.1:9',
    });
    expect(exitCode).toBe(3);
    expect(JSON.parse(stderr).error.code).toBe('network_error');
  }, 30_000);

  it('exits 4 when no API key is configured', async () => {
    const home = mkdtempSync(resolve(tmpdir(), 'nuntly-cli-home-'));
    try {
      const { exitCode } = await run(['broadcasts', 'retrieve', 'bc_1'], {
        env: { NUNTLY_API_KEY: undefined, HOME: home, USERPROFILE: home },
      });
      expect(exitCode).toBe(4);
      expect(requests).toHaveLength(0);
    } finally {
      rmSync(home, { recursive: true, force: true });
    }
  });

  it('exits 2 on an unreadable --file', async () => {
    const { exitCode } = await run(['broadcasts', 'update', 'bc_1', '--file', 'missing.json']);
    expect(exitCode).toBe(2);
  });
});

describe('credentials', () => {
  let home: string;

  beforeEach(() => {
    home = mkdtempSync(resolve(tmpdir(), 'nuntly-cli-home-'));
    mkdirSync(resolve(home, '.nuntly'));
    writeFileSync(
      resolve(home, '.nuntly', 'config.json'),
      JSON.stringify({
        defaultProfile: 'default',
        profiles: {
          default: { apiKey: 'default_key', baseUrl: 'http://127.0.0.1:9' },
          staging: { apiKey: 'staging_key', baseUrl: server.url.origin },
        },
      }),
    );
  });

  afterEach(() => rmSync(home, { recursive: true, force: true }));

  const envWith = (extra: Record<string, string | undefined> = {}) => ({
    NUNTLY_API_KEY: 'env_key',
    NUNTLY_BASE_URL: 'http://127.0.0.1:9',
    HOME: home,
    USERPROFILE: home,
    ...extra,
  });

  it('takes the key and the host from --profile over NUNTLY_API_KEY', async () => {
    const { exitCode } = await run(['--profile', 'staging', 'broadcasts', 'retrieve', 'bc_1'], { env: envWith() });
    expect(exitCode).toBe(0);
    expect(requests[0].authorization).toBe('Bearer staging_key');
  });

  it('takes the key and the host from NUNTLY_PROFILE over NUNTLY_API_KEY', async () => {
    const { exitCode } = await run(['broadcasts', 'retrieve', 'bc_1'], {
      env: envWith({ NUNTLY_PROFILE: 'staging' }),
    });
    expect(exitCode).toBe(0);
    expect(requests[0].authorization).toBe('Bearer staging_key');
  });

  it('refuses an explicit profile with no key before any request', async () => {
    const { exitCode } = await run(['--profile', 'missing', 'broadcasts', 'retrieve', 'bc_1'], { env: envWith() });
    expect(exitCode).toBe(4);
    expect(requests).toHaveLength(0);
  });
});

describe('login', () => {
  let home: string;

  beforeEach(() => {
    home = mkdtempSync(resolve(tmpdir(), 'nuntly-cli-home-'));
  });

  afterEach(() => rmSync(home, { recursive: true, force: true }));

  const savedConfig = () => JSON.parse(readFileSync(resolve(home, '.nuntly', 'config.json'), 'utf-8'));

  it('reads the key from stdin with --with-token and prompts nothing', async () => {
    const { exitCode, stdout } = await run(['login', '--with-token'], {
      stdin: 'nuntly_sk_piped\n',
      env: { HOME: home, USERPROFILE: home },
    });
    expect(exitCode).toBe(0);
    expect(stdout).toBe('');
    expect(savedConfig().profiles.default.apiKey).toBe('nuntly_sk_piped');
  });

  it('refuses --with-token with an empty stdin', async () => {
    const { exitCode } = await run(['login', '--with-token'], {
      stdin: '',
      env: { HOME: home, USERPROFILE: home },
    });
    expect(exitCode).toBe(2);
  });

  it('asks for the key with a hidden prompt', async () => {
    const proc = Bun.spawn(
      ['bun', '--preload', resolve(import.meta.dir, 'fixtures/prompts-mock.ts'), ENTRY, 'login', 'staging'],
      { env: { ...process.env, HOME: home, USERPROFILE: home }, stdout: 'pipe', stderr: 'pipe' },
    );
    const [stdout, exitCode] = await Promise.all([new Response(proc.stdout).text(), proc.exited]);
    expect(exitCode).toBe(0);
    expect(stdout).toContain('password: Enter your API key');
    expect(savedConfig().profiles.staging.apiKey).toBe('typed_key');
  });
});

describe('boolean flags', () => {
  it('sends false with --no-<flag>', async () => {
    const { exitCode } = await run(['domains', 'update', 'dm_1', '--no-sending', '--open-tracking']);
    expect(exitCode).toBe(0);
    expect(requests[0].body).toEqual({ sending: false, openTracking: true });
  });

  it('leaves an unset boolean out of the body', async () => {
    await run(['domains', 'update', 'dm_1', '--receiving']);
    expect(requests[0].body).toEqual({ receiving: true });
  });
});

describe('object flags', () => {
  it('sends --fallback as a JSON object', async () => {
    reply = { status: 202, body: { data: { id: 'bk_1', emails: [] } } };
    const { exitCode } = await run([
      'emails',
      'bulk',
      'send',
      '--emails',
      JSON.stringify([{ to: 'user@example.com', subject: 'Hi', text: 'Hello' }]),
      '--fallback',
      JSON.stringify({ from: 'hello@acme.com' }),
    ]);
    expect(exitCode).toBe(0);
    expect((requests[0].body as { fallback: unknown }).fallback).toEqual({
      from: 'hello@acme.com',
    });
  });
});

describe('completion', () => {
  for (const shell of ['bash', 'zsh', 'fish', 'powershell']) {
    it(`lists every command group for ${shell}`, async () => {
      const { exitCode, stdout } = await run(['completion', shell]);
      expect(exitCode).toBe(0);
      for (const group of [
        'broadcasts',
        'contacts',
        'contact-properties',
        'segments',
        'templates',
        'topics',
        'emails',
      ]) {
        expect(stdout).toContain(group);
      }
    });
  }
});
