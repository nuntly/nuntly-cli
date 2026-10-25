import { readFileSync, readSync } from 'node:fs';

export function readStdin(): string {
  const chunks: Buffer[] = [];
  const buf = Buffer.alloc(4096);
  try {
    while (true) {
      const bytesRead = readSync(0, buf, 0, buf.length, null);
      if (bytesRead <= 0) break;
      chunks.push(buf.subarray(0, bytesRead));
    }
  } catch (e: any) {
    if (e.code !== 'EOF' && e.code !== 'EAGAIN') throw e;
  }
  return Buffer.concat(chunks).toString('utf-8');
}

export function readInput(filePath: string): unknown {
  const raw = filePath === '-' ? readStdin() : readFileSync(filePath, 'utf-8');
  return JSON.parse(raw);
}

// Stdin is read only on `--file -`: an implicit read would consume the input
// of a `while read` loop and hang on a stdin that never closes.
export function resolveBody(file: string | undefined, flags: Record<string, unknown>): unknown {
  if (!file) return flags;
  const given = Object.entries(flags)
    .filter(([, value]) => value !== undefined)
    .map(
      ([name, value]) => `--${value === false ? 'no-' : ''}${name.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase()}`,
    );
  if (given.length > 0) throw new Error(`--file cannot be combined with ${given.join(', ')}`);
  return readInput(file);
}
