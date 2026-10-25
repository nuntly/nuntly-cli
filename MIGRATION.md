# Migration guide

## `v1.x` → `v2.0.0`

These changes can break a 1.x script.

### Input and flags

- A write command reads stdin only with `--file -`. A piped body without `--file -` is ignored, so pass `--file -` to keep sending it: `cat payload.json | nuntly emails send --file -`. Agents and CI jobs no longer fail with `JSON Parse error: Unexpected EOF`, a command in a `while read` loop no longer consumes the loop's input, and a stdin that never closes no longer blocks the command.
- `--file` combined with a body flag is a usage error: `nuntly emails send --file payload.json --to user@example.com` exits with code 2, names `--to`, and sends nothing. 1.x sent the file's body, dropped the flags and exited 0. Put every field in the file, or drop `--file` and pass flags only.
- `nuntly emails bulk send --fallback '{"from":"hello@acme.com"}'` sends `fallback` as an object. It used to send the JSON as a string.
- On a nullable field, the literal `null` clears it: `nuntly inboxes update <inbox-id> --name null` sends `"name": null`. It used to send the string `"null"`.
- Enum flags (`--status`, `--events`, `--permission`) refuse a value outside their set before any request and exit with code 2. An invalid value used to reach the API and exit with code 1.
- `--events` on `nuntly webhooks create|update` accepts the 14 event types a webhook delivers. The 7 internal types (such as `email.queued` or `email.unsubscribed`) are a usage error. See [Webhooks use the webhook event types only](https://github.com/nuntly/nuntly-sdk-typescript/blob/main/MIGRATION.md#6-webhooks-use-the-webhook-event-types-only) in the SDK guide.

### Commands

- `nuntly emails bulk list <bulk-id>` reads one bulk request, not a page, so it is now `nuntly emails bulk retrieve <bulk-id>`.
- `nuntly webhooks events deliveries <id> <event-id>` is now `nuntly webhooks events deliveries list <id> <event-id>`.

### Authentication

- The API key and the base URL come from the same source: a profile selected with `--profile` or `NUNTLY_PROFILE`, else `NUNTLY_API_KEY` with `NUNTLY_BASE_URL`, else the default profile. An explicit profile used to lose to `NUNTLY_API_KEY`, and the env key was sent to the profile's `baseUrl`. A script that sets both a profile and `NUNTLY_API_KEY` now uses the profile's key: unset `NUNTLY_PROFILE` or drop `--profile` to keep the env key. `NUNTLY_BASE_URL` no longer applies to a key read from a profile; set `baseUrl` in the profile.
- `nuntly login` hides the key as you type it, and `nuntly login --with-token` reads it from stdin with no prompt.

### Errors and exit codes

- The JSON error envelope on stderr carries the API error: `{ "error": { "status": 422, "code": "invalid_body", "message": "The body is invalid", "details": "...", "requestId": "..." } }`. `code` used to be `HTTP_<status>` (now in `status`) or `CLIENT_ERROR` (now `client_error`), and the `fields` key is gone: read `details`.
- A network error (API unreachable or timed out) exits with code 3 instead of 2, which stays the usage error code. A missing API key exits with code 4 (authentication) instead of 1, and `nuntly completion <unknown-shell>` exits with code 2 instead of 1.

### Changes from the TypeScript SDK

The CLI sends its requests through `@nuntly/sdk`, so these changes of the [SDK migration guide](https://github.com/nuntly/nuntly-sdk-typescript/blob/main/MIGRATION.md) apply to it too:

- The CLI retries a conflict only when the API asks for it, and retries a command that creates something after a server or network error only when it carries an idempotency key, which the send commands generate. See [Retries and non-JSON errors](https://github.com/nuntly/nuntly-sdk-typescript/blob/main/MIGRATION.md#5-retries-and-non-json-errors).
- `nuntly agents memory retrieve` returns an empty memory instead of a not-found error when nothing is saved, and `nuntly agents memory upsert` checks the inbox and thread. See [Agent memory reads as empty](https://github.com/nuntly/nuntly-sdk-typescript/blob/main/MIGRATION.md#3-agent-memory-reads-as-empty).
- A path id equal to `''`, `.` or `..` fails before any request is sent. See [Fixed in 2.0.0](https://github.com/nuntly/nuntly-sdk-typescript/blob/main/MIGRATION.md#fixed-in-200).
- The JSON output of a list command carries `"nextCursor": null` on the last page. It used to leave `nextCursor` out there. See [Fixed in 2.0.0](https://github.com/nuntly/nuntly-sdk-typescript/blob/main/MIGRATION.md#fixed-in-200).

### New in 2.0.0 (no change needed)

- A boolean flag has a `--no-` form that sends `false` (`nuntly domains update <domain-id> --no-sending`); it used to be impossible to send `false` without `--file`.
- The message content formats are `--content-format html,text`; `--format` stays the output format.
- `nuntly threads retrieve <thread-id> --mark-read` removes the unread label from every message of the thread.
