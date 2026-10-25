# @nuntly/cli

[![npm version](https://img.shields.io/npm/v/@nuntly/cli.svg)](https://www.npmjs.com/package/@nuntly/cli)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://github.com/nuntly/nuntly-cli/blob/main/LICENSE)

Command-line interface for [Nuntly](https://nuntly.com), the developer-first email platform. Send emails, manage domains, webhooks, inboxes, and more from your terminal.

[Documentation](https://nuntly.com/docs) | [API Reference](https://nuntly.com/docs/api) | [Get your API key](https://nuntly.com/auth/sign-up)

## Table of contents

- [Requirements](#requirements)
- [Installation](#installation)
- [Authentication](#authentication)
- [Quick start](#quick-start)
- [Broadcast quick start](#broadcast-quick-start)
- [Exit codes](#exit-codes)
- [Commands](#commands)
- [Output formats](#output-formats)
- [FAQ and troubleshooting](#faq-and-troubleshooting)
- [Upgrading](#upgrading)
- [Semantic versioning](#semantic-versioning)
- [Contributing](#contributing)
- [License](#license)

## Requirements

- macOS, Linux, or Windows on x64 or arm64
- For the npm install path: Node.js 20 or later (or Bun)
- For the standalone binary install path: no runtime required, the binary embeds the JavaScript runtime
- A Nuntly API key from [https://nuntly.com/auth/sign-up](https://nuntly.com/auth/sign-up)

## Installation

### One-liner (macOS / Linux)

```bash
curl -fsSL https://raw.githubusercontent.com/nuntly/nuntly-cli/main/scripts/install.sh | bash
```

Detects your OS and architecture, downloads the matching binary from GitHub Releases, verifies its SHA-256 checksum, and installs to `~/.nuntly/bin`. To pin a version, end the command with `bash -s -- --version v1.2.3`.

### Homebrew (macOS / Linux)

```bash
brew install nuntly/tap/nuntly
```

### npm (requires Node.js 20+ or Bun)

```bash
npm install -g @nuntly/cli
```

Windows, `npx` and the standalone binaries: see the [CLI docs page](https://nuntly.com/docs/api-reference/cli#install).

## Authentication

`nuntly login` (recommended) asks for your API key without echoing it and saves it to `~/.nuntly/config.json` (chmod 600).

```bash
nuntly login                                     # interactive
echo "$NUNTLY_KEY" | nuntly login --with-token   # in a script, read the key from stdin

nuntly login staging                  # save a key (and a base URL) under "staging"
nuntly --profile staging domains list
NUNTLY_PROFILE=staging nuntly domains list

export NUNTLY_API_KEY=your-api-key    # environment variable
nuntly --api-key your-key emails list # per-command flag
```

The API key and the base URL always come from the same source, so a key is
never sent to another source's host:

1. A profile selected with `--profile <name>` or `NUNTLY_PROFILE`: its key and its `baseUrl`
2. `NUNTLY_API_KEY`, with `NUNTLY_BASE_URL`
3. The default profile in `~/.nuntly/config.json`

`--api-key` replaces the key of a selected profile; without a profile it is
used with `NUNTLY_BASE_URL`.

## Quick start

```bash
# Send an email
nuntly emails send \
  --from hello@yourcompany.com \
  --to user@example.com \
  --subject "Welcome" \
  --html "<h1>Welcome!</h1>"

# List sent emails
nuntly emails list

# Get email details
nuntly emails retrieve em_01ka8k8s80gvx9604cn9am5st4

# Add a domain
nuntly domains create --name example.com --sending

# Create a webhook
nuntly webhooks create \
  --endpoint-url https://example.com/hooks \
  --events email.delivered,email.bounced
```

Sending needs a verified domain: the `--from` address must be on a domain you added to Nuntly and verified (see [sending domains](https://nuntly.com/docs/guides/sending-domains)). Until then, a send fails with the `domain_not_verified` error code, or `domain_not_found` for a domain you never added.

### Confirmation prompts

Delete commands and `broadcasts send` ask for confirmation:

```
$ nuntly domains delete dm_5678efgh
◆ Delete domain dm_5678efgh? › No / Yes
```

Pass `-y` / `--yes` to skip the prompt. When stdin is not a TTY, the CLI
refuses to run them without `--yes` to avoid accidents in pipelines.

```bash
nuntly --yes broadcasts send bc_1234abcd
```

### JSON body from a file or stdin

A write command builds its body from its flags, or reads a JSON body from
`--file <path>`. It reads stdin only with `--file -`, so a command inside a
`while read` loop, or in a job whose stdin stays open, never waits on it.
`--file` combined with a body flag is a usage error (exit code 2) that names
the flag: put every field in the file, or pass flags only.

```bash
# From a JSON file
nuntly emails bulk send --file batch.json --idempotency-key mybatch-v1

# From stdin (pipe)
cat batch.json | nuntly emails bulk send --file -
```

`batch.json` is an object matching `CreateBulkEmailsRequest`: an `emails` array,
plus an optional `fallback` whose fields apply to every email that omits them.

```json
{
  "fallback": { "from": "hello@yourcompany.com", "subject": "Welcome" },
  "emails": [
    { "to": "ada@example.com", "text": "Hi Ada" },
    { "to": "grace@example.com", "text": "Hi Grace" }
  ]
}
```

### Idempotency-Key for send commands

`emails send`, `emails bulk send`, `messages reply`, and `messages forward`
support an `--idempotency-key` flag. The Nuntly API deduplicates by the
`Idempotency-Key` HTTP header, so a retried send replays the first response
instead of sending a duplicate. Without the flag the SDK generates a UUID v4
per call; pass your own key when your job runner needs a stable identifier.

```bash
nuntly messages reply mg_4567ghij \
  --text "thanks" \
  --idempotency-key "reply-mg_4567ghij-v1"
```

## Broadcast quick start

A broadcast sends one template to the contacts of a segment. This script creates a contact in a segment, publishes a template version, then sends a broadcast. `--quiet` prints only the id of what a command creates:

```bash
# A contact in a segment
CONTACT_ID=$(nuntly contacts create --email jane@yourcustomer.com --quiet)
SEGMENT_ID=$(nuntly segments create --name "Early adopters" --quiet)
nuntly contacts segments add "$CONTACT_ID" "$SEGMENT_ID"

# A template with one published version
TEMPLATE_ID=$(nuntly templates create --name "Monthly product update" --quiet)
VERSION_ID=$(nuntly templates versions create "$TEMPLATE_ID" \
  --subject "What shipped in {{month}}" \
  --html '<p>Here is what shipped in {{month}}.</p><p><a href="{{system.unsubscribeUrl}}">Unsubscribe</a></p>' \
  --variables '[{"name":"month","type":"string"}]' \
  --quiet)
nuntly templates versions publish "$TEMPLATE_ID" "$VERSION_ID"

# A broadcast to the segment, sent now
BROADCAST_ID=$(nuntly broadcasts create \
  --from "Your Company <updates@yourcompany.com>" \
  --template-id "$TEMPLATE_ID" \
  --segment-id "$SEGMENT_ID" \
  --variables '{"month":"October"}' \
  --quiet)
nuntly --yes broadcasts send "$BROADCAST_ID"
```

Add `--scheduled-at` with an ISO 8601 date to `broadcasts send` to schedule the broadcast instead. A version whose HTML has no `{{system.unsubscribeUrl}}` link cannot be published. The broadcast `--from` address needs a verified domain too, or `broadcasts create` fails with `broadcast_no_eligible_domain`. See the [broadcast guides](https://nuntly.com/docs/guides/broadcast-overview) for segments, topics and unsubscribes.

## Exit codes

| Code | Meaning |
|------|---------|
| 0 | Success |
| 1 | Generic API error (HTTP 4xx/5xx not covered below) |
| 2 | Usage / validation error (unknown flag, invalid value, missing argument, unreadable `--file` or `--file` with a body flag, confirmation refused without a TTY) |
| 3 | Network error (the API could not be reached or timed out) |
| 4 | Authentication / authorization failure (no API key, or HTTP 401 or 403) |
| 5 | Rate limit exceeded (HTTP 429) |
| 130 | SIGINT (Ctrl+C) |

```bash
nuntly emails send --from ... --to ... --subject ...
case $? in
  0) echo "ok" ;;
  3) echo "network issue, retry later" ;;
  4) echo "rotate the API key" ;;
  5) echo "backing off, retrying later" ;;
  *) echo "see stderr for details" ;;
esac
```

## Commands

Run `nuntly --help` for the list of commands, and `nuntly <command> --help` for
the flags of one command. [SKILL.md](https://github.com/nuntly/nuntly-cli/blob/main/SKILL.md)
documents every command and flag. `nuntly completion <shell>` prints shell
completion for bash, zsh, fish or powershell.

A boolean flag sends `true` and its `--no-` form sends `false`:

```bash
nuntly domains update dm_5678efgh --no-sending --open-tracking
```

An object flag takes JSON, for example
`nuntly emails bulk send --emails '[...]' --fallback '{"from":"hello@acme.com"}'`.

## Output formats

```bash
# Default: a table for a list and JSON for one object in a terminal, JSON when piped
nuntly emails retrieve em_123

# Compact JSON (for piping to jq)
nuntly emails list --raw | jq '.data[].id'

# ID only (for scripting)
nuntly emails send ... --quiet
# em_01ka8k8s80gvx9604cn9am5st4
```

`--format` also takes `json`, `table`, `csv`, `yaml` and `markdown`; see [SKILL.md](https://github.com/nuntly/nuntly-cli/blob/main/SKILL.md#output-formats).

## FAQ and troubleshooting

**Which install path should I pick?**
The standalone binary (Homebrew or one-liner) is the simplest: no runtime to install, no dependency conflicts. Pick the npm install if you already use Node.js or Bun in CI and want to pin a version per project.

**`nuntly: command not found`**
Install the CLI globally with `npm i -g @nuntly/cli`, or use the curl one-liner from the [Installation](#installation) section. Confirm your `npm` global prefix is on `$PATH` (`npm config get prefix`).

**`Error: API key not found`**
Run `nuntly login` to store a key on disk, or export `NUNTLY_API_KEY=...` in your shell. A profile selected with `--profile` or `NUNTLY_PROFILE` must hold a key itself: the CLI does not fall back to the environment for it.

**HTTP 401 errors on every command**
The current key is invalid, revoked, or scoped to a different organization. Run `nuntly api-keys list` from another working key (or the dashboard) to confirm the active key fingerprint, then `nuntly login` again with a fresh key.

**`command timeout` or hangs**
Check network connectivity to `api.nuntly.com`. Corporate proxies typically require `HTTPS_PROXY=...` to be set in the environment.

**How do I use a custom API base URL?**
Set `NUNTLY_BASE_URL` next to `NUNTLY_API_KEY`, or set `baseUrl` in a profile of `~/.nuntly/config.json` and select it with `--profile`. The base URL is taken from the same source as the key.

**Why does `nuntly --help` open in less?**
Commander.js paginates long help output. Pipe through `cat` (`nuntly --help | cat`) or set `PAGER=cat` to disable pagination.

**How do I report a bug?**
Open an issue at [github.com/nuntly/nuntly-cli/issues](https://github.com/nuntly/nuntly-cli/issues) with the output of `nuntly --version`, the command you ran, and the error message.

## Upgrading

Upgrading from 1.x? See [MIGRATION.md](https://github.com/nuntly/nuntly-cli/blob/main/MIGRATION.md).

## Semantic versioning

This CLI follows [Semantic Versioning 2.0](https://semver.org): only a major version breaks a command, a flag or an output format, and the CLI version tracks the Nuntly SDK version closely.

## Contributing

Issues, bug reports, and feature requests are welcome at [github.com/nuntly/nuntly-cli/issues](https://github.com/nuntly/nuntly-cli/issues).

## License

MIT. See [LICENSE](https://github.com/nuntly/nuntly-cli/blob/main/LICENSE).
