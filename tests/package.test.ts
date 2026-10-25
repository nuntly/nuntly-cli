import { afterAll, beforeAll, describe, expect, it } from 'bun:test';
import { spawnSync } from 'node:child_process';
import { cpSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';

const ROOT = resolve(import.meta.dir, '..');
const TMP = resolve(tmpdir(), `nuntly-cli-pack-test-${Date.now()}`);

// Mirrors the release workflow's dist/ after build, compile:all and checksums.
const DIST_FILES = [
  'index.js',
  'index.d.ts',
  'index.js.map',
  'nuntly',
  'nuntly-darwin-arm64',
  'nuntly-darwin-arm64.sha256',
  'nuntly-linux-x64',
  'nuntly-windows-x64.exe',
  'nuntly-windows-x64.exe.sha256',
];

function packedFiles(): string[] {
  const result = spawnSync('npm', ['pack', '--dry-run', '--json', '--ignore-scripts'], { cwd: TMP, encoding: 'utf8' });
  if (result.status !== 0) throw new Error(result.stderr);
  const [pack] = JSON.parse(result.stdout) as [{ files: { path: string }[] }];
  return pack.files.map((f) => f.path).sort();
}

beforeAll(() => {
  mkdirSync(resolve(TMP, 'dist'), { recursive: true });
  cpSync(resolve(ROOT, 'package.json'), resolve(TMP, 'package.json'));
  cpSync(resolve(ROOT, 'bin'), resolve(TMP, 'bin'), { recursive: true });
  for (const file of DIST_FILES) {
    writeFileSync(resolve(TMP, 'dist', file), 'stub');
  }
});

afterAll(() => {
  rmSync(TMP, { recursive: true, force: true });
});

describe('npm tarball', () => {
  it('ships only the bin entry and the JS build', () => {
    expect(packedFiles()).toEqual(['bin/nuntly.js', 'dist/index.d.ts', 'dist/index.js', 'package.json']);
  });
});
