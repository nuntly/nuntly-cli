import { afterEach, beforeEach, describe, expect, it, spyOn } from 'bun:test';
import { agentsCommand } from '../src/commands/agents.js';
import { messagesCommand } from '../src/commands/messages.js';
import { threadsCommand } from '../src/commands/threads.js';

describe('query options on retrieve commands', () => {
  const env = { ...process.env };
  const originalFetch = globalThis.fetch;
  let requestedUrl: string;

  beforeEach(() => {
    process.env.NUNTLY_API_KEY = 'test_key';
    process.env.NUNTLY_BASE_URL = 'https://api.test.com';
    globalThis.fetch = ((input: string | Request | URL) => {
      requestedUrl = input instanceof Request ? input.url : input.toString();
      return Promise.resolve(
        new Response(JSON.stringify({ data: { id: 'x' } }), {
          headers: { 'content-type': 'application/json' },
        }),
      );
    }) as typeof fetch;
    spyOn(process.stdout, 'write').mockImplementation(() => true);
  });

  afterEach(() => {
    process.env = { ...env };
    globalThis.fetch = originalFetch;
  });

  it('sends --content-format as repeated format keys, apart from the output --format', async () => {
    await messagesCommand.parseAsync(
      ['content', 'retrieve', 'msg_1', '--content-format', 'html,text', '--format', 'json'],
      { from: 'user' },
    );
    expect(new URL(requestedUrl).searchParams.getAll('format')).toEqual(['html', 'text']);
  });

  it('sends the --mark-read switch as markRead=true on threads retrieve', async () => {
    await threadsCommand.parseAsync(['retrieve', 'thr_1', '--mark-read'], { from: 'user' });
    expect(new URL(requestedUrl).searchParams.get('markRead')).toBe('true');
  });

  it('omits markRead without the --mark-read switch', async () => {
    await threadsCommand.parseAsync(['retrieve', 'thr_1'], { from: 'user' });
    expect(new URL(requestedUrl).searchParams.has('markRead')).toBe(false);
  });

  it('sends --inbox-id and --thread-id on agents memory retrieve', async () => {
    await agentsCommand.parseAsync(['memory', 'retrieve', 'agent_1', '--inbox-id', 'ibx_1', '--thread-id', 'thr_1'], {
      from: 'user',
    });
    const params = new URL(requestedUrl).searchParams;
    expect(params.get('inboxId')).toBe('ibx_1');
    expect(params.get('threadId')).toBe('thr_1');
  });
});
