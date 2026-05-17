# @nuntly/cli

[![npm version](https://img.shields.io/npm/v/@nuntly/cli.svg)](https://www.npmjs.com/package/@nuntly/cli)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)

Command-line interface for [Nuntly](https://nuntly.com), the developer-first email platform. Send emails, manage domains, webhooks, inboxes, and more from your terminal.

[Documentation](https://nuntly.com/docs) | [API Reference](https://nuntly.com/docs/api) | [Get your API key](https://nuntly.com/auth/sign-up)

## Table of contents

- [Requirements](#requirements)
- [Installation](#installation)
- [Authentication](#authentication)
- [Quick start](#quick-start)
- [Exit codes](#exit-codes)
- [Commands](#commands)
- [Output formats](#output-formats)
- [Delete confirmation](#delete-confirmation)
- [FAQ](#faq)
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

Detects your OS and architecture, downloads the matching binary from GitHub Releases, verifies its SHA-256 checksum, and installs to `~/.nuntly/bin`.

Pin a specific version:

```bash
curl -fsSL https://raw.githubusercontent.com/nuntly/nuntly-cli/main/scripts/install.sh | bash -s -- --version v1.2.3
```

### One-liner (Windows PowerShell)

```powershell
irm https://raw.githubusercontent.com/nuntly/nuntly-cli/main/scripts/install.ps1 | iex
```

Installs `nuntly.exe` to `%USERPROFILE%\.nuntly\bin` and adds it to your user `PATH`.

### Homebrew (macOS / Linux)

```bash
brew install nuntly/tap/nuntly
```

### npm (requires Node.js 18+ or Bun)

```bash
npm install -g @nuntly/cli
```

### npx (no install)

```bash
npx @nuntly/cli emails list
```

### Standalone binary (no runtime required)

Download the binary for your platform from [GitHub Releases](https://github.com/nuntly/nuntly-cli/releases):

| Platform | Binary |
|----------|--------|
| macOS ARM (M1/M2/M3) | `nuntly-darwin-arm64` |
| macOS Intel | `nuntly-darwin-x64` |
| Linux x64 | `nuntly-linux-x64` |
| Linux ARM | `nuntly-linux-arm64` |
| Windows x64 | `nuntly-windows-x64.exe` |

Each binary ships with a matching `.sha256` checksum file.

### Docker

```bash
docker run --rm -e NUNTLY_API_KEY=your-key ghcr.io/nuntly/cli emails list
```

## Authentication

### Interactive login (recommended)

```bash
nuntly login
```

Saves your API key to `~/.nuntly/config.json` (chmod 600).

### Environment variable

```bash
export NUNTLY_API_KEY=your-api-key
nuntly emails list
```

### Per-command flag

```bash
nuntly --api-key your-key emails list
```

Priority: `--api-key` flag > `NUNTLY_API_KEY` env var > `~/.nuntly/config.json`

## Non-interactive use (CI / scripts)

### Skip delete confirmation

Destructive commands (`delete`) prompt for confirmation by default. Pass `-y` /
`--yes` to skip the prompt. When stdin is not a TTY, the CLI refuses to delete
without `--yes` to avoid accidental destruction in pipelines.

```bash
nuntly --yes domains delete dm_5678efgh
nuntly -y webhooks delete wh_9012ijkl
```

### Idempotency-Key for send commands

`emails send`, `emails bulk send`, `messages reply`, and `messages forward`
support an `--idempotency-key` flag. The Nuntly API deduplicates by the
`Idempotency-Key` HTTP header, so safe retries replay rather than duplicate.

When the flag is omitted the SDK auto-generates a UUID v4 per call. Pass an
explicit key when your job runner needs a stable, replay-safe identifier.

```bash
nuntly emails send \
  --from hello@yourcompany.com \
  --to user@example.com \
  --subject "Welcome" \
  --text "Hi" \
  --idempotency-key "welcome-user-42"

nuntly messages reply mg_4567ghij \
  --text "thanks" \
  --idempotency-key "reply-mg_4567ghij-v1"
```

## Quick start

```bash
# Login
nuntly login

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

### Bulk send

```bash
# From a JSON file
nuntly emails bulk send --file batch.json --idempotency-key mybatch-v1

# From stdin (pipe)
cat batch.json | nuntly emails bulk send
```

`batch.json` is an array of email envelopes matching `CreateEmailRequest`. The
`--idempotency-key` lets you safely retry the batch without sending duplicates.

## Exit codes

| Code | Meaning |
|------|---------|
| 0 | Success |
| 1 | Generic API error (HTTP 4xx/5xx not covered below) |
| 2 | Usage / validation error (unknown flag, missing argument, ...) |
| 4 | Authentication / authorization failure (HTTP 401 or 403) |
| 5 | Rate limit exceeded (HTTP 429) |
| 130 | SIGINT (Ctrl+C) |

```bash
nuntly emails send --from ... --to ... --subject ...
case $? in
  0) echo "ok" ;;
  4) echo "rotate the API key" ;;
  5) echo "backing off, retrying later" ;;
  *) echo "see stderr for details" ;;
esac
```

## Commands

```
nuntly login                          Save API key
nuntly emails send [options]          Send an email
nuntly emails list [options]          List sent emails
nuntly emails retrieve <id>           Get email details
nuntly emails cancel <id>             Cancel scheduled email
nuntly emails stats retrieve          Get sending statistics
nuntly emails events list <id>        Get email event history
nuntly emails content retrieve <id>   Get email content URLs
nuntly emails bulk send [options]     Send bulk emails
nuntly domains create [options]       Add a domain
nuntly domains list                   List domains
nuntly domains retrieve <id>          Get domain details
nuntly domains update <id> [options]  Update domain settings
nuntly domains delete <id>            Remove a domain
nuntly webhooks create [options]      Register webhook endpoint
nuntly webhooks list                  List webhooks
nuntly webhooks retrieve <id>         Get webhook details
nuntly webhooks update <id> [options] Update webhook
nuntly webhooks delete <id>           Remove webhook
nuntly api-keys create [options]      Generate API key
nuntly api-keys list                  List API keys
nuntly api-keys delete <id>           Revoke API key
```

Run `nuntly <command> --help` for details on any command.

## Output formats

```bash
# Default: pretty-printed JSON
nuntly emails retrieve em_123

# Compact JSON (for piping to jq)
nuntly emails list --format json | jq '.data[].id'

# ID only (for scripting)
nuntly emails send ... --quiet
# em_01ka8k8s80gvx9604cn9am5st4
```

## Delete confirmation

All delete commands require interactive confirmation:

```
$ nuntly domains delete dns_01ka8k8s80gvx9604cn9am5st4
? Delete domains dns_01ka8k8s80gvx9604cn9am5st4? (Y/n)
```

## FAQ

**Which install path should I pick?**
The standalone binary (Homebrew or one-liner) is the simplest: no runtime to install, no dependency conflicts. Pick the npm install if you already use Node.js or Bun in CI and want to pin a version per project.

**How do I use a custom API base URL?**
Set `NUNTLY_BASE_URL` in the environment, or use the per-profile `baseUrl` option in `~/.nuntly/config.json`.

**Why does `nuntly --help` open in less?**
Commander.js paginates long help output. Pipe through `cat` (`nuntly --help | cat`) or set `PAGER=cat` to disable pagination.

**How do I report a bug?**
Open an issue at [github.com/nuntly/nuntly-cli/issues](https://github.com/nuntly/nuntly-cli/issues) with the output of `nuntly --version`, the command you ran, and the error message.

## Semantic versioning

This CLI follows [Semantic Versioning 2.0](https://semver.org). Pre-1.0 versions (alpha, beta) may include breaking command changes between minor versions.

After `1.0.0`:

- **Major** version bumps signal breaking command, flag, or output changes
- **Minor** version bumps add new commands, flags, or output formats backwards-compatibly
- **Patch** version bumps include backwards-compatible fixes

The CLI version tracks the underlying Nuntly SDK version closely.

## Contributing

Issues, bug reports, and feature requests are welcome at [github.com/nuntly/nuntly-cli/issues](https://github.com/nuntly/nuntly-cli/issues).

## Troubleshooting

**`nuntly: command not found`**
Install the CLI globally with `npm i -g @nuntly/cli`, or use the curl one-liner from the [Installation](#installation) section. Confirm your `npm` global prefix is on `$PATH` (`npm config get prefix`).

**`Error: API key not found`**
Run `nuntly login` to store a key on disk, or export `NUNTLY_API_KEY=...` in your shell. The CLI checks the environment variable first, then the on-disk credentials.

**HTTP 401 errors on every command**
The current key is invalid, revoked, or scoped to a different organization. Run `nuntly api-keys list` from another working key (or the dashboard) to confirm the active key fingerprint, then `nuntly login` again with a fresh key.

**`command timeout` or hangs**
Check network connectivity to `api.nuntly.com` and retry with `--debug` to print the full request/response trace. Corporate proxies typically require `HTTPS_PROXY=...` to be set in the environment.

## License

MIT. See [LICENSE](./LICENSE).
