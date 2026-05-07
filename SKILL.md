# Nuntly CLI

Command-line interface for Nuntly, the developer-first email platform.

## Authentication

Resolution order (highest priority first):
1. `NUNTLY_API_KEY` environment variable
2. Profile in `~/.nuntly/config.json` (set via `nuntly login`)
3. `--profile <name>` to use a specific profile

## Output Formats

| Flag | Behavior |
|------|----------|
| (none) | Auto-detect: table for lists, JSON for single objects. JSON when piped. |
| `--format json` | Pretty-printed JSON |
| `--format raw` / `--raw` | Compact JSON (one line, for piping to jq) |
| `--format table` | Human-readable table with column headers |
| `--format csv` | CSV with RFC 4180 escaping |
| `--format yaml` | YAML |
| `--format markdown` | Markdown table |
| `-q` / `--quiet` | Output only the resource ID |
| `--fields id,status` | Filter which columns are displayed |
| `--no-header` | Omit column headers in table/csv |

## File Input

Commands that accept a request body auto-detect piped stdin. You can also use `--file <path>` to read from a file.

```bash
# Pipe JSON from stdin (auto-detected)
cat payload.json | nuntly emails send

# Read from a file
nuntly emails send --file payload.json
```

## Error Format

In JSON/pipe mode, errors are written to stderr as:
```json
{ "error": { "code": "HTTP_400", "message": "...", "requestId": "..." } }
```
Exit code 1 = API error, exit code 2 = client/usage error.

## Commands

### agents

#### `nuntly agents memory retrieve`

Retrieve the memory for an AI agent.

Arguments: `<agent-id>`

```bash
nuntly agents memory retrieve ag_6789yzab
```

#### `nuntly agents memory upsert`

Create or update the memory for an AI agent.

Arguments: `<agent-id>`

Required: `--memory`

Optional: `--inbox-id`, `--thread-id`, `--summary`

```bash
nuntly agents memory upsert ag_6789yzab --memory "value"
```

### api-keys

#### `nuntly api-keys retrieve`

Returns API key metadata. The key value is never returned after creation.

Arguments: `<id>`

```bash
nuntly api-keys retrieve id_example
```

#### `nuntly api-keys update`

Update the key name, permissions, or restrict it to specific sending domains.

Arguments: `<id>`

Required: `--permission`

Optional: `--name`, `--status`, `--domain-ids`

```bash
nuntly api-keys update id_example --permission sendingAccess
```

#### `nuntly api-keys delete`

Revoke an API key. Requests authenticating with this key will be rejected immediately.

Arguments: `<id>`

```bash
nuntly api-keys delete id_example
```

#### `nuntly api-keys create`

Generate a new API key. The key value is only returned once — store it securely.

Required: `--permission`

Optional: `--name`, `--status`, `--domain-ids`

```bash
nuntly api-keys create --permission sendingAccess
```

#### `nuntly api-keys list`

Returns all API keys for the organization. Key values are never included in list responses.

Pagination: `--cursor`, `--limit`

```bash
nuntly api-keys list
```

### domains

#### `nuntly domains list`

Returns all domains with their verification and capability status.

Pagination: `--cursor`, `--limit`

```bash
nuntly domains list
```

#### `nuntly domains retrieve`

Returns a domain with its DNS record configuration and current verification status for each record.

Arguments: `<id>`

```bash
nuntly domains retrieve dm_5678efgh
```

#### `nuntly domains delete`

Permanently deletes a domain along with its inboxes, received messages, attachments, and sending configuration. This action is irreversible.

Arguments: `<id>`

```bash
nuntly domains delete dm_5678efgh
```

#### `nuntly domains create`

Add a domain to start configuring DNS records for sending or receiving emails.

Required: `--name`

Optional: `--sending`, `--receiving`

```bash
nuntly domains create --name my-resource
```

#### `nuntly domains update`

Toggle sending, receiving, open tracking, or click tracking capabilities for a domain.

Arguments: `<id>`

Optional: `--open-tracking`, `--click-tracking`, `--sending`, `--receiving`

```bash
nuntly domains update dm_5678efgh
```

### emails

#### `nuntly emails stats retrieve`

Returns aggregated daily sending statistics for the current period.

```bash
nuntly emails stats retrieve
```

#### `nuntly emails events list`

Returns the full delivery event history for an email (sent, delivered, opened, bounced, etc.).

Arguments: `<id>`

```bash
nuntly emails events list em_1234abcd
```

#### `nuntly emails content retrieve`

Returns presigned URLs to download the HTML, plain-text, and raw MIME source of a sent email.

Arguments: `<id>`

```bash
nuntly emails content retrieve em_1234abcd
```

#### `nuntly emails bulk send`

Send up to 20 emails in a single request. Use `fallback` to set default values shared across all messages.

Required: `--emails`

Optional: `--fallback`

```bash
nuntly emails bulk send --emails "value"
```

#### `nuntly emails bulk list`

Returns the delivery status of all emails submitted in a bulk request.

Arguments: `<bulk-id>`

```bash
nuntly emails bulk list em_1234abcd
```

#### `nuntly emails retrieve`

Returns an email with its current delivery status and metadata.

Arguments: `<id>`

```bash
nuntly emails retrieve em_1234abcd
```

#### `nuntly emails list`

Returns sent emails ordered by submission date, newest first.

Pagination: `--cursor`, `--limit`

```bash
nuntly emails list
```

#### `nuntly emails send`

Send transactional emails through Nuntly platform. It supports HTML and plain-text emails, attachments, labels, custom headers and scheduling.

Required: `--from`, `--to`, `--subject`

Optional: `--cc`, `--bcc`, `--reply-to`, `--text`, `--html`, `--headers`, `--tags`, `--attachments`, `--variables`, `--scheduled-at`

```bash
nuntly emails send --from hello@acme.com --to user@example.com --subject "Welcome aboard"
```

#### `nuntly emails cancel`

Cancel a scheduled email before delivery. Only emails with `scheduled` status can be cancelled.

Arguments: `<id>`

```bash
nuntly emails cancel em_1234abcd
```

### inboxes

#### `nuntly inboxes threads list`

List threads in an inbox.

Arguments: `<inbox-id>`

Pagination: `--cursor`, `--limit`

```bash
nuntly inboxes threads list ib_7890qrst
```

#### `nuntly inboxes messages send`

Send a new message from an inbox.

Arguments: `<inbox-id>`

Required: `--to`, `--subject`

Optional: `--cc`, `--bcc`, `--text`, `--html`

```bash
nuntly inboxes messages send ib_7890qrst --to user@example.com --subject "Welcome aboard"
```

#### `nuntly inboxes create`

Create a new inbox on a verified domain.

Required: `--address`

Optional: `--domain-id`, `--name`, `--namespace-id`, `--agent-id`

```bash
nuntly inboxes create --address support
```

#### `nuntly inboxes list`

List all inboxes.

Pagination: `--cursor`, `--limit`

```bash
nuntly inboxes list
```

#### `nuntly inboxes retrieve`

Retrieve an inbox with thread stats.

Arguments: `<inbox-id>`

```bash
nuntly inboxes retrieve ib_7890qrst
```

#### `nuntly inboxes update`

Update an inbox.

Arguments: `<inbox-id>`

Optional: `--name`

```bash
nuntly inboxes update ib_7890qrst
```

#### `nuntly inboxes delete`

Soft-delete an inbox.

Arguments: `<inbox-id>`

```bash
nuntly inboxes delete ib_7890qrst
```

### messages

#### `nuntly messages content retrieve`

Returns presigned URLs to download the HTML, plain-text, and raw MIME source of a received message.

Arguments: `<message-id>`

```bash
nuntly messages content retrieve mg_4567ghij
```

#### `nuntly messages attachments list`

List all attachments for a message.

Arguments: `<message-id>`

```bash
nuntly messages attachments list mg_4567ghij
```

#### `nuntly messages attachments retrieve`

Retrieve an attachment with a presigned download URL.

Arguments: `<message-id>`, `<attachment-id>`

```bash
nuntly messages attachments retrieve mg_4567ghij mg_4567ghij
```

#### `nuntly messages list`

List all received messages across inboxes.

Pagination: `--cursor`, `--limit`

```bash
nuntly messages list
```

#### `nuntly messages retrieve`

Retrieve a single message with inbox enrichment.

Arguments: `<message-id>`

```bash
nuntly messages retrieve mg_4567ghij
```

#### `nuntly messages update`

Update message labels. Only available for messages in user-created inboxes.

Arguments: `<message-id>`

Optional: `--add-labels`, `--remove-labels`

```bash
nuntly messages update mg_4567ghij
```

#### `nuntly messages reply`

Reply to a message. Set replyAll to true to reply to all recipients.

Arguments: `<message-id>`

Required: `--reply-all`

Optional: `--text`, `--html`

```bash
nuntly messages reply mg_4567ghij --reply-all
```

#### `nuntly messages forward`

Forward a message to new recipients.

Arguments: `<message-id>`

Required: `--to`

Optional: `--text`

```bash
nuntly messages forward mg_4567ghij --to user@example.com
```

### namespaces

#### `nuntly namespaces inboxes list`

List inboxes in a namespace.

Arguments: `<namespace-id>`

Pagination: `--cursor`, `--limit`

```bash
nuntly namespaces inboxes list ib_7890qrst
```

#### `nuntly namespaces create`

Create a new namespace.

Required: `--name`

Optional: `--external-id`

```bash
nuntly namespaces create --name my-resource
```

#### `nuntly namespaces list`

List all namespaces.

Pagination: `--cursor`, `--limit`

```bash
nuntly namespaces list
```

#### `nuntly namespaces retrieve`

Retrieve a namespace with inbox stats.

Arguments: `<namespace-id>`

```bash
nuntly namespaces retrieve ns_2345uvwx
```

#### `nuntly namespaces update`

Update a namespace.

Arguments: `<namespace-id>`

Optional: `--name`, `--external-id`

```bash
nuntly namespaces update ns_2345uvwx
```

#### `nuntly namespaces delete`

Soft-delete a namespace. Rejects if it has active inboxes.

Arguments: `<namespace-id>`

```bash
nuntly namespaces delete ns_2345uvwx
```

### organizations

#### `nuntly organizations usage retrieve`

Returns current period usage metrics (daily and monthly) for sending and receiving, against your plan limits.

Arguments: `<id>`

```bash
nuntly organizations usage retrieve org_8901klmn
```

#### `nuntly organizations list`

Returns all organizations the authenticated user belongs to.

Pagination: `--cursor`, `--limit`

```bash
nuntly organizations list
```

#### `nuntly organizations retrieve`

Returns the organization's profile, plan, region, and account status.

Arguments: `<id>`

```bash
nuntly organizations retrieve org_8901klmn
```

### threads

#### `nuntly threads messages list`

List messages in a thread (chronological order).

Arguments: `<thread-id>`

Pagination: `--cursor`, `--limit`

```bash
nuntly threads messages list th_0123cdef
```

#### `nuntly threads retrieve`

Retrieve a thread. Pass ?markRead=true to automatically remove the unread label from all messages.

Arguments: `<thread-id>`

```bash
nuntly threads retrieve th_0123cdef
```

#### `nuntly threads update`

Update thread labels and agent assignment. Label operations apply to all messages in the thread.

Arguments: `<thread-id>`

Optional: `--add-labels`, `--remove-labels`, `--agent-id`

```bash
nuntly threads update th_0123cdef
```

### webhooks

#### `nuntly webhooks events list`

Returns recent webhook events across all registered endpoints.

Pagination: `--cursor`, `--limit`

```bash
nuntly webhooks events list
```

#### `nuntly webhooks events replay`

Re-deliver a webhook event to its endpoint. Useful for retrying failed deliveries.

Arguments: `<id>`, `<event-id>`

```bash
nuntly webhooks events replay wh_9012ijkl wh_9012ijkl
```

#### `nuntly webhooks events deliveries`

Returns all delivery attempts for a webhook event, including HTTP status codes and response times.

Arguments: `<id>`, `<event-id>`

```bash
nuntly webhooks events deliveries wh_9012ijkl wh_9012ijkl
```

#### `nuntly webhooks retrieve`

Returns a webhook endpoint with its URL, subscribed events, and configuration.

Arguments: `<id>`

```bash
nuntly webhooks retrieve wh_9012ijkl
```

#### `nuntly webhooks update`

Update the endpoint URL, subscribed event types, or rotate the signing secret.

Arguments: `<id>`

Optional: `--name`, `--endpoint-url`, `--events`, `--status`, `--rotate-secret`

```bash
nuntly webhooks update wh_9012ijkl
```

#### `nuntly webhooks delete`

Remove a webhook endpoint. No further events will be delivered to this URL.

Arguments: `<id>`

```bash
nuntly webhooks delete wh_9012ijkl
```

#### `nuntly webhooks create`

Register an endpoint to start receiving webhook events for your organization.

Required: `--endpoint-url`, `--events`

Optional: `--name`, `--status`

```bash
nuntly webhooks create --endpoint-url https://acme.com/webhooks --events email.sent,email.delivered
```

#### `nuntly webhooks list`

Returns all registered webhook endpoints for the organization.

Pagination: `--cursor`, `--limit`

```bash
nuntly webhooks list
```
