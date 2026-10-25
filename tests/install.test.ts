import { describe, expect, it } from 'bun:test';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const ROOT = resolve(import.meta.dir, '..');

describe('install.ps1', () => {
  it('downloads only a Windows binary that the release builds', () => {
    const release = readFileSync(resolve(ROOT, '.github/workflows/release.yml'), 'utf8');
    const script = readFileSync(resolve(ROOT, 'scripts/install.ps1'), 'utf8');
    const built = new Set([...release.matchAll(/nuntly-windows-([a-z0-9]+)\.exe/g)].map((m) => m[1]));
    const requested = [...script.matchAll(/'(?:windows-)?(x64|x86|arm64)'/g)].map((m) => m[1]);

    expect(requested.length).toBeGreaterThan(0);
    for (const arch of requested) {
      expect(built).toContain(arch);
    }
  });

  it('fails the install when the downloaded binary does not start', () => {
    const script = readFileSync(resolve(ROOT, 'scripts/install.ps1'), 'utf8');
    const check = script.indexOf('& $exe --version');
    expect(script).not.toMatch(/catch\s*\{\s*\}/);
    expect(script).toMatch(/catch\s*\{\s*Stop-WithError/);
    expect(script).toMatch(/if \(\$LASTEXITCODE -ne 0\) \{\s*Stop-WithError/);
    expect(check).toBeGreaterThan(-1);
    expect(check).toBeLessThan(script.indexOf('Add-PathToUserEnv -Path $BinDir'));
    expect(check).toBeLessThan(script.indexOf('Nuntly CLI installed.'));
  });

  it('gets a Windows binary built for baseline x64, which Windows on ARM can emulate', () => {
    const pkg = JSON.parse(readFileSync(resolve(ROOT, 'package.json'), 'utf8')) as { scripts: Record<string, string> };
    expect(pkg.scripts['compile:all']).toContain(
      '--target=bun-windows-x64-baseline --outfile dist/nuntly-windows-x64.exe',
    );
  });
});
