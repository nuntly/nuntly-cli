import { afterAll, beforeAll, describe, expect, it } from 'bun:test';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { Server } from 'bun';

// Runs each README quick start in bash against a stub API, so a renamed command or flag,
// or a JSON value the CLI cannot parse, fails here before a reader runs it.
const ENTRY = resolve(import.meta.dir, '../src/index.ts');
const README = readFileSync(resolve(import.meta.dir, '../README.md'), 'utf-8');

// The same rule as the SDK generator's README check: this package ships as a repository of its own.
const quickStarts = README.split(/^#{2,} /m)
  .slice(1)
  .filter((section) => /quick start$/i.test(section.split('\n', 1)[0]))
  .flatMap((section) =>
    [...section.matchAll(/^```bash\n([\s\S]*?)^```$/gm)].map((m) => [section.split('\n', 1)[0], m[1]] as const),
  );

let server: Server;
let requests: string[];

beforeAll(() => {
  server = Bun.serve({
    port: 0,
    fetch(req) {
      const { pathname } = new URL(req.url);
      requests.push(`${req.method} ${pathname}`);
      // A list route ends with the resource name; every other route answers one object.
      const list = req.method === 'GET' && /\/[a-z-]+$/.test(pathname);
      return Response.json(list ? { data: [], nextCursor: null } : { data: { id: 'id_1', status: 'queued' } });
    },
  });
});

afterAll(() => server.stop(true));

describe('README quick starts', () => {
  it('include the broadcast quick start', () => {
    expect(quickStarts.map(([heading]) => heading)).toContain('Broadcast quick start');
  });

  it.each(quickStarts)(
    '%s runs as written',
    async (_heading, code) => {
      requests = [];
      const proc = Bun.spawn(['bash', '-c', `set -euo pipefail\nnuntly() { "$BUN" "$CLI_ENTRY" "$@"; }\n${code}`], {
        env: {
          ...process.env,
          BUN: process.execPath,
          CLI_ENTRY: ENTRY,
          // A selected profile would win over the stub and run these writes against a real account.
          NUNTLY_PROFILE: undefined,
          NUNTLY_API_KEY: 'test_key',
          NUNTLY_BASE_URL: server.url.origin,
        },
        stdin: 'ignore',
        stdout: 'pipe',
        stderr: 'pipe',
      });
      const [, stderr, exitCode] = await Promise.all([
        new Response(proc.stdout).text(),
        new Response(proc.stderr).text(),
        proc.exited,
      ]);
      expect({ exitCode, stderr }).toEqual({ exitCode: 0, stderr: '' });
      // One request per command: none was skipped.
      expect(requests).toHaveLength(code.match(/\bnuntly /g)?.length ?? 0);
    },
    30_000,
  );
});
