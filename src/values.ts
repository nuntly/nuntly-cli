import { InvalidArgumentError } from 'commander';

// The literal `null` clears a nullable field. Applied on the body, not as a
// Commander parser: Commander turns a parser's null into an empty string.
export function nullable(value: string | undefined): string | null | undefined {
  return value === 'null' ? null : value;
}

export function listOrNull(values: string[] | undefined): string[] | null | undefined {
  if (!values?.length) return undefined;
  return values.length === 1 && values[0] === 'null' ? null : values;
}

// A `string | number` flag: a JSON number or JSON string keeps its type,
// any other text is sent as a string.
export function stringOrNumber(value: string | undefined): string | number | undefined {
  if (value === undefined) return undefined;
  try {
    const parsed: unknown = JSON.parse(value);
    if (typeof parsed === 'number' || typeof parsed === 'string') return parsed;
  } catch {
    // Plain text such as `free`.
  }
  return value;
}

// A comma-separated enum flag; Commander's `.choices()` only checks a single value.
export function choiceList(choices: readonly string[]) {
  return (value: string): string[] => {
    const items = value.split(',');
    if (items.some((item) => !choices.includes(item))) {
      throw new InvalidArgumentError(`Allowed choices are ${choices.join(', ')}.`);
    }
    return items;
  };
}
