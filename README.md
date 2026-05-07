# @nuntly/cli

[![npm version](https://img.shields.io/npm/v/@nuntly/cli.svg)](https://www.npmjs.com/package/@nuntly/cli)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)

Command-line interface for [Nuntly](https://nuntly.com), the developer-first email platform. Send emails, manage domains, webhooks, inboxes, and more from your terminal.

[Documentation](https://nuntly.com/docs) | [API Reference](https://nuntly.com/docs/api) | [Get your API key](https://app.nuntly.com/signup)

## Table of contents

- [Requirements](#requirements)
- [Installation](#installation)
- [Authentication](#authentication)
- [Quick start](#quick-start)
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
- A Nuntly API key from [https://app.nuntly.com/signup](https://app.nuntly.com/signup)

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
nuntly emails list --json | jq '.data[].id'

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

Issues, bug reports, and feature requests are welcome at [github.com/nuntly/nuntly-cli/issues](https://github.com/nuntly/nuntly-cli/issues). Command surfaces are generated from the Nuntly OpenAPI spec, so direct PRs that modify them will likely be redirected to upstream feedback. Documentation, examples, and developer-experience improvements are the highest-impact contribution areas.

## License

MIT. See [LICENSE](./LICENSE).
