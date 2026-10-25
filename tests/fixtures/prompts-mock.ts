import { mock } from 'bun:test';

// Records which prompt asked for each value, so a test can check that the
// API key prompt hides its input.
const answers: Record<string, string> = {
  password: 'typed_key',
  text: '',
};
const record = (kind: string) => async (opts: { message: string }) => {
  console.log(`${kind}: ${opts.message}`);
  return answers[kind];
};

mock.module('@clack/prompts', () => ({
  intro: () => {},
  outro: () => {},
  note: () => {},
  cancel: () => {},
  isCancel: () => false,
  text: record('text'),
  password: record('password'),
}));
