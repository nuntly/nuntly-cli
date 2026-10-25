# Nuntly CLI

Command-line interface for Nuntly, the developer-first email platform.

## Authentication

The API key and the base URL always come from the same source (highest priority first):
1. A profile selected with `--profile <name>` or `NUNTLY_PROFILE`: its key and its `baseUrl`
2. `NUNTLY_API_KEY`, with `NUNTLY_BASE_URL`
3. The default profile in `~/.nuntly/config.json` (set via `nuntly login`)

`--api-key <key>` replaces the key of a selected profile; without a profile it is used with `NUNTLY_BASE_URL`. To save a key without a prompt: `echo "$KEY" | nuntly login --with-token`.

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

Commands that accept a request body build it from their flags, or read a JSON body with `--file <path>`. Stdin is read only with `--file -`, so a command in a `while read` loop or with an open stdin never waits on it. `--file` combined with a body flag is a usage error that names the flag.

```bash
# Pipe JSON from stdin
cat payload.json | nuntly emails send --file -

# Read from a file
nuntly emails send --file payload.json
```

## Flag Values

Pass `null` to clear a nullable field, for example `nuntly broadcasts update <broadcast-id> --template-id null`.

A boolean flag sends `true`; its `--no-` form sends `false`, for example `nuntly domains update <id> --no-sending`.

A flag marked (JSON) takes a JSON document, for example `nuntly broadcasts update <broadcast-id> --variables '{"month":"October"}'`.

On a list command, `--all` fetches every page instead of one.

## Error Format

In JSON/pipe mode, an error raised while a command runs is written to stderr as below; `code` is the API error code and `details` is present when the API sends it. A network or client error carries only `code` (`network_error`, `client_error`) and `message`. Errors found before the request is built (an unknown flag or invalid value, a refused confirmation, a missing API key) are printed as plain text: branch on the exit code.
```json
{ "error": { "status": 422, "code": "invalid_body", "message": "The body is invalid", "details": "...", "requestId": "..." } }
```

| Exit code | Meaning |
|-----------|---------|
| 0 | Success |
| 1 | API error (HTTP 4xx/5xx not listed below) |
| 2 | Usage error: unknown flag, invalid value, unreadable `--file` or `--file` with a body flag, confirmation refused without a TTY |
| 3 | Network error: the API could not be reached or timed out |
| 4 | Authentication: no API key, or HTTP 401/403 |
| 5 | Rate limit exceeded (HTTP 429) |

## Commands

### agents

#### `nuntly agents memory retrieve`

Retrieves the key-value memory and summary saved for an AI agent, at organization level or scoped to one inbox or thread via query parameters.

Arguments: `<agent-id>`

Query: `--inbox-id`, `--thread-id`

```bash
nuntly agents memory retrieve aB3dE7fG
```

#### `nuntly agents memory upsert`

Saves the key-value memory and optional summary of an AI agent, at organization level or scoped to a specific inbox or thread. Returns the saved memory.

Arguments: `<agent-id>`

Required: `--memory` (JSON)

Optional: `--inbox-id`, `--thread-id`, `--summary`

```bash
nuntly agents memory upsert aB3dE7fG --memory '{"lastTopic":"billing","openTickets":2}'
```

### api-keys

#### `nuntly api-keys create`

Creates an API key with full access or send-only access, optionally limited to chosen domains. The secret key value is returned only in this response.

Optional: `--name`, `--status`, `--permission`, `--domain-ids`

```bash
nuntly api-keys create --name Production
```

#### `nuntly api-keys delete`

Permanently deletes an API key. Any request that authenticates with this key is rejected from then on. This cannot be undone.

Arguments: `<id>`

```bash
nuntly api-keys delete apk_01ka8k8s80gvx9604cn9am5st4
```

#### `nuntly api-keys list`

Lists the API keys of your organization, newest first, with cursor pagination. Each key shows its name, status, creation date, and a short token hint.

Pagination: `--cursor`, `--limit`, `--all`

```bash
nuntly api-keys list
```

#### `nuntly api-keys retrieve`

Retrieves an API key by id with its name, status, creation date, and a short token hint. The full secret key value is never returned after creation.

Arguments: `<id>`

```bash
nuntly api-keys retrieve apk_01ka8k8s80gvx9604cn9am5st4
```

#### `nuntly api-keys update`

Updates the name of an API key, enables or disables it, or changes its access level and domain restrictions. Returns the id of the updated key.

Arguments: `<id>`

Optional: `--name`, `--status`, `--permission`, `--domain-ids`

```bash
nuntly api-keys update apk_01ka8k8s80gvx9604cn9am5st4 --name Production
```

### broadcasts

#### `nuntly broadcasts recipients list`

List the recipients of a broadcast.

Arguments: `<broadcast-id>`

Pagination: `--cursor`, `--limit`, `--all`

```bash
nuntly broadcasts recipients list bc_01kabn43yqyxn2bx4ve84mczd3
```

#### `nuntly broadcasts create`

Create a broadcast for your contacts.

Required: `--from`

Optional: `--template-id`, `--name`, `--subject`, `--reply-to`, `--topic-id`, `--segment-id`, `--variables` (JSON)

```bash
nuntly broadcasts create --from "Tomlinson AI <ray@info.tomlinson.ai>" --name "October newsletter"
```

#### `nuntly broadcasts delete`

Delete a draft, scheduled, or failed broadcast.

Arguments: `<broadcast-id>`

```bash
nuntly broadcasts delete bc_01kabn43yqyxn2bx4ve84mczd3
```

#### `nuntly broadcasts list`

List the organization broadcasts.

Pagination: `--cursor`, `--limit`, `--all`

```bash
nuntly broadcasts list
```

#### `nuntly broadcasts retrieve`

Retrieve a broadcast and its status.

Arguments: `<broadcast-id>`

```bash
nuntly broadcasts retrieve bc_01kabn43yqyxn2bx4ve84mczd3
```

#### `nuntly broadcasts send`

Send a broadcast now or schedule it.

Arguments: `<broadcast-id>`

Optional: `--scheduled-at`

```bash
nuntly broadcasts send bc_01kabn43yqyxn2bx4ve84mczd3 --scheduled-at 2026-03-30T09:00:00.000Z
```

#### `nuntly broadcasts update`

Edit a draft or scheduled broadcast.

Arguments: `<broadcast-id>`

Optional: `--template-id`, `--from`, `--name`, `--subject`, `--reply-to`, `--topic-id`, `--segment-id`, `--variables` (JSON), `--status`

```bash
nuntly broadcasts update bc_01kabn43yqyxn2bx4ve84mczd3 --name "October newsletter"
```

### contact-properties

#### `nuntly contact-properties create`

Create a contact property.

Required: `--name`, `--type`

Optional: `--description`, `--default-value`

```bash
nuntly contact-properties create --name plan --type string
```

#### `nuntly contact-properties delete`

Delete a contact property.

Arguments: `<contact-property-id>`

```bash
nuntly contact-properties delete ctpd_01kabn43yqyxn2bx4ve84mczd3
```

#### `nuntly contact-properties list`

List the organization contact properties.

Pagination: `--cursor`, `--limit`, `--all`

```bash
nuntly contact-properties list
```

#### `nuntly contact-properties retrieve`

Retrieve one contact property.

Arguments: `<contact-property-id>`

```bash
nuntly contact-properties retrieve ctpd_01kabn43yqyxn2bx4ve84mczd3
```

#### `nuntly contact-properties update`

Update a contact property.

Arguments: `<contact-property-id>`

Optional: `--description`, `--default-value`

```bash
nuntly contact-properties update ctpd_01kabn43yqyxn2bx4ve84mczd3 --description "The plan the customer is on."
```

### contacts

#### `nuntly contacts segments add`

Add a contact to a segment. Idempotent.

Arguments: `<contact-id>`, `<segment-id>`

```bash
nuntly contacts segments add ct_01kabn43yqyxn2bx4ve84mczd3 seg_01kabn43yqyxn2bx4ve84mczd3
```

#### `nuntly contacts segments list`

List a contact's segments.

Arguments: `<contact-id>`

```bash
nuntly contacts segments list ct_01kabn43yqyxn2bx4ve84mczd3
```

#### `nuntly contacts segments remove`

Remove a contact from a segment.

Arguments: `<contact-id>`, `<segment-id>`

```bash
nuntly contacts segments remove ct_01kabn43yqyxn2bx4ve84mczd3 seg_01kabn43yqyxn2bx4ve84mczd3
```

#### `nuntly contacts segments retrieve`

Check if a contact is in a segment.

Arguments: `<contact-id>`, `<segment-id>`

```bash
nuntly contacts segments retrieve ct_01kabn43yqyxn2bx4ve84mczd3 seg_01kabn43yqyxn2bx4ve84mczd3
```

#### `nuntly contacts topics list`

List a contact's subscription state per topic.

Arguments: `<contact-id>`

```bash
nuntly contacts topics list ct_01kabn43yqyxn2bx4ve84mczd3
```

#### `nuntly contacts topics update`

Subscribe or unsubscribe a contact from a topic.

Arguments: `<contact-id>`, `<topic-id>`

Required: `--state`

```bash
nuntly contacts topics update ct_01kabn43yqyxn2bx4ve84mczd3 tpc_01kabn43yqyxn2bx4ve84mczd3 --state subscribed
```

#### `nuntly contacts create`

Create a contact.

Required: `--email`

Optional: `--properties` (JSON)

```bash
nuntly contacts create --email jane@example.com
```

#### `nuntly contacts delete`

Delete a contact.

Arguments: `<contact-id>`

```bash
nuntly contacts delete ct_01kabn43yqyxn2bx4ve84mczd3
```

#### `nuntly contacts list`

List the organization contacts.

Pagination: `--cursor`, `--limit`, `--all`

```bash
nuntly contacts list
```

#### `nuntly contacts retrieve`

Retrieve one contact.

Arguments: `<contact-id>`

```bash
nuntly contacts retrieve ct_01kabn43yqyxn2bx4ve84mczd3
```

#### `nuntly contacts update`

Update a contact's properties.

Arguments: `<contact-id>`

Optional: `--email`, `--properties` (JSON)

```bash
nuntly contacts update ct_01kabn43yqyxn2bx4ve84mczd3 --properties '{"plan":"pro"}'
```

### domains

#### `nuntly domains create`

Adds a domain for sending, receiving, or both, and returns the DNS records to publish. Verification starts automatically and the plan domain limit applies.

Required: `--name`

Optional: `--sending`, `--receiving`

```bash
nuntly domains create --name example.com
```

#### `nuntly domains delete`

Permanently deletes a domain along with its inboxes, received messages, attachments, and sending configuration. This action is irreversible.

Arguments: `<id>`

```bash
nuntly domains delete dns_01kabn43yqyxn2bx4ve84mczd3
```

#### `nuntly domains list`

Lists the domains of your organization, newest first, with cursor pagination. Each domain shows its verification status and sending and receiving status.

Pagination: `--cursor`, `--limit`, `--all`

```bash
nuntly domains list
```

#### `nuntly domains retrieve`

Retrieves a domain with its capabilities, tracking settings, statuses, and the DNS records to publish, each with its own verification status.

Arguments: `<id>`

```bash
nuntly domains retrieve dns_01kabn43yqyxn2bx4ve84mczd3
```

#### `nuntly domains update`

Turns sending, receiving, open tracking, or click tracking on or off for a domain. Enabling a capability adds its DNS records and restarts verification.

Arguments: `<id>`

Optional: `--open-tracking`, `--click-tracking`, `--sending`, `--receiving`

```bash
nuntly domains update dns_01kabn43yqyxn2bx4ve84mczd3 --open-tracking --click-tracking
```

### emails

#### `nuntly emails events list`

Returns the full event history of an email, newest first, such as queued, sent, delivered, opened, clicked or bounced. The list is not paginated.

Arguments: `<id>`

```bash
nuntly emails events list em_01ka8k8s80gvx9604cn9am5st4
```

#### `nuntly emails bulk retrieve`

Returns the emails created by a bulk request, with the id and current status of each one, looked up by the bulk id returned when it was sent.

Arguments: `<bulk-id>`

```bash
nuntly emails bulk retrieve blk_01ka8k8s80gvx9604cn9am5st4
```

#### `nuntly emails bulk send`

Queues 1 to 20 emails in one request with optional shared fallback values, and returns a bulk id plus the id and status of each email. No scheduling.

Required: `--emails` (JSON)

Optional: `--fallback` (JSON)

```bash
nuntly emails bulk send --emails '[{"from":"Tomlinson AI <ray@info.tomlinson.ai>","to":"brian67@gmail.com","subject":"Verify your email address","text":"Thank you for signing up! Please verify your email address."}]'
```

#### `nuntly emails content retrieve`

Returns download links, valid for 2 minutes, for the HTML, plain-text and raw MIME versions of an email, plus its stored subject and body templates.

Arguments: `<id>`

```bash
nuntly emails content retrieve em_01ka8k8s80gvx9604cn9am5st4
```

#### `nuntly emails stats retrieve`

Returns daily email counts for the last 30 days and today, per status and engagement type (sent, delivered, bounced, opened, clicked and more).

```bash
nuntly emails stats retrieve
```

#### `nuntly emails cancel`

Cancels a scheduled email before it is sent and returns its id with status canceled. Only scheduled emails sent outside a bulk request qualify.

Arguments: `<id>`

```bash
nuntly emails cancel em_01ka8k8s80gvx9604cn9am5st4
```

#### `nuntly emails list`

Lists your emails newest first with cursor pagination, up to 30 per page. Each item has its sender, recipients, subject, status and submission date.

Pagination: `--cursor`, `--limit`, `--all`

```bash
nuntly emails list
```

#### `nuntly emails retrieve`

Returns a single email by id with its delivery status, status reason, recipients, subject, headers, tags, attachment metadata and schedule.

Arguments: `<id>`

```bash
nuntly emails retrieve em_01ka8k8s80gvx9604cn9am5st4
```

#### `nuntly emails send`

Send transactional emails through Nuntly platform. It supports HTML and plain-text emails, attachments, labels, custom headers and scheduling.

Required: `--from`, `--to`, `--subject`

Optional: `--cc`, `--bcc`, `--reply-to`, `--text`, `--html`, `--headers` (JSON), `--tags` (JSON), `--attachments` (JSON), `--variables` (JSON), `--scheduled-at`

```bash
nuntly emails send --from "Tomlinson AI <ray@info.tomlinson.ai>" --to brian67@gmail.com --subject "Verify your email address" --text 'Thank you for signing up! Please verify your email address.' --html '<h1>Welcome 🎉</h1><p>Thank you for signing up! Please verify your email address.</p>' --tags '[{"name":"category","value":"transactional"}]'
```

### inboxes

#### `nuntly inboxes threads list`

Lists the threads in an inbox, most recently active first, with cursor pagination. Filter by labels; spam and trash threads are excluded by default.

Arguments: `<inbox-id>`

Query: `--labels`

Pagination: `--cursor`, `--limit`, `--all`

```bash
nuntly inboxes threads list ibx_01kabn43yqyxn2bx4ve84mczd3
```

#### `nuntly inboxes messages send`

Sends a new email from an inbox to one or more recipients. The message is queued for delivery and the response returns its id, thread id, and Message-ID.

Arguments: `<inbox-id>`

Required: `--to`, `--subject`

Optional: `--cc`, `--bcc`, `--text`, `--html`

```bash
nuntly inboxes messages send ibx_01kabn43yqyxn2bx4ve84mczd3 --to brian67@gmail.com --subject "Verify your email address" --text 'Thank you for signing up! Please verify your email address.' --html '<h1>Welcome</h1><p>Thank you for signing up! Please verify your email address.</p>'
```

#### `nuntly inboxes create`

Creates an inbox address on a verified domain with receiving active, or on your provided domain if none is given. Can assign a namespace and agent id.

Required: `--address`

Optional: `--domain-id`, `--name`, `--namespace-id`, `--agent-id`

```bash
nuntly inboxes create --address support
```

#### `nuntly inboxes delete`

Deletes an inbox so it no longer appears in lists and stops matching incoming mail. The default catch-all inbox of a domain cannot be deleted.

Arguments: `<inbox-id>`

```bash
nuntly inboxes delete ibx_01kabn43yqyxn2bx4ve84mczd3
```

#### `nuntly inboxes list`

Lists the active inboxes of your organization, newest first, with cursor pagination. Optionally filter the results to a single namespace.

Query: `--namespace-id`

Pagination: `--cursor`, `--limit`, `--all`

```bash
nuntly inboxes list
```

#### `nuntly inboxes retrieve`

Retrieves an inbox by id, including its address, domain, display name, namespace, and assigned agent id. Deleted inboxes return a not found error.

Arguments: `<inbox-id>`

```bash
nuntly inboxes retrieve ibx_01kabn43yqyxn2bx4ve84mczd3
```

#### `nuntly inboxes update`

Updates the display name of an inbox, used as the sender name on messages it sends. Set the name to null to clear it. Returns the inbox id.

Arguments: `<inbox-id>`

Optional: `--name`

```bash
nuntly inboxes update ibx_01kabn43yqyxn2bx4ve84mczd3 --name "Support team"
```

### messages

#### `nuntly messages attachments list`

Lists the attachments of a message with their filename, content type, size, disposition and content id. Download links are not included.

Arguments: `<message-id>`

```bash
nuntly messages attachments list imsg_01kabn43yqyxn2bx4ve84mczd3
```

#### `nuntly messages attachments retrieve`

Retrieves the metadata of an attachment and a temporary download URL that expires after 15 minutes. Use it to fetch the attachment file itself.

Arguments: `<message-id>`, `<attachment-id>`

```bash
nuntly messages attachments retrieve imsg_01kabn43yqyxn2bx4ve84mczd3 iatt_01kabn43yqyxn2bx4ve84mczd3
```

#### `nuntly messages content retrieve`

Returns temporary download URLs, valid for 2 minutes, for the HTML, plain-text or raw MIME content of a message. Only HTML is returned by default.

Arguments: `<message-id>`

Query: `--content-format`

```bash
nuntly messages content retrieve imsg_01kabn43yqyxn2bx4ve84mczd3
```

#### `nuntly messages forward`

Sends a message with a Fwd: subject from the inbox of the original message to one or more new recipients, in a new thread, with an optional text note.

Arguments: `<message-id>`

Required: `--to`

Optional: `--text`

```bash
nuntly messages forward imsg_01kabn43yqyxn2bx4ve84mczd3 --to brian67@gmail.com --text 'Thank you for signing up! Please verify your email address.'
```

#### `nuntly messages list`

Lists messages newest first, with cursor pagination and optional filters by domain and sender. Each item includes its labels, status and attachment count.

Query: `--domain-id`, `--from`

Pagination: `--cursor`, `--limit`, `--all`

```bash
nuntly messages list
```

#### `nuntly messages reply`

Replies from the inbox that holds the message, in the same thread. Set replyAll to true to also copy the other recipients. The send is queued.

Arguments: `<message-id>`

Optional: `--text`, `--html`, `--reply-all`

```bash
nuntly messages reply imsg_01kabn43yqyxn2bx4ve84mczd3 --text 'Thank you for signing up! Please verify your email address.' --html '<h1>Welcome</h1><p>Thank you for signing up! Please verify your email address.</p>'
```

#### `nuntly messages retrieve`

Retrieves a received or sent message by id, including its sender, recipients, subject, labels, status, attachment count and raw headers.

Arguments: `<message-id>`

```bash
nuntly messages retrieve imsg_01kabn43yqyxn2bx4ve84mczd3
```

#### `nuntly messages update`

Adds or removes labels on a message. Only messages in user-created inboxes accept labels, and a message can hold at most 10 labels.

Arguments: `<message-id>`

Optional: `--add-labels`, `--remove-labels`

```bash
nuntly messages update imsg_01kabn43yqyxn2bx4ve84mczd3 --add-labels urgent
```

### namespaces

#### `nuntly namespaces inboxes list`

Lists the active inboxes assigned to a namespace, newest first, with cursor pagination. Returns the same inbox objects as the inbox list.

Arguments: `<namespace-id>`

Pagination: `--cursor`, `--limit`, `--all`

```bash
nuntly namespaces inboxes list ns_01kabn43yqyxn2bx4ve84mczd3
```

#### `nuntly namespaces create`

Creates a namespace to group inboxes, with a display name and an optional external id that maps it to a customer or tenant in your own system.

Required: `--name`

Optional: `--external-id`

```bash
nuntly namespaces create --name "Customer support"
```

#### `nuntly namespaces delete`

Deletes a namespace by id. The request is rejected with a validation error while the namespace still has active inboxes, so delete them first.

Arguments: `<namespace-id>`

```bash
nuntly namespaces delete ns_01kabn43yqyxn2bx4ve84mczd3
```

#### `nuntly namespaces list`

Lists the namespaces of your organization, newest first, with cursor pagination. Each item includes the name and the optional external id.

Pagination: `--cursor`, `--limit`, `--all`

```bash
nuntly namespaces list
```

#### `nuntly namespaces retrieve`

Retrieves a namespace by id with its name, its optional external id, and inbox counts, including how many of its inboxes are currently active.

Arguments: `<namespace-id>`

```bash
nuntly namespaces retrieve ns_01kabn43yqyxn2bx4ve84mczd3
```

#### `nuntly namespaces update`

Updates the display name or external id of a namespace. Set the external id to null to clear it. Returns the id of the updated namespace.

Arguments: `<namespace-id>`

Optional: `--name`, `--external-id`

```bash
nuntly namespaces update ns_01kabn43yqyxn2bx4ve84mczd3 --name "Customer support"
```

### organizations

#### `nuntly organizations usage retrieve`

Returns the daily and monthly email usage of the organization, with each limit, its reset time, and a breakdown by channel.

Arguments: `<id>`

```bash
nuntly organizations usage retrieve org_01ka8k8s80gvx9604cn9am5st4
```

#### `nuntly organizations list`

Lists the organization that the API key belongs to, with its id, name, and status. The result is paginated with a cursor like other list endpoints.

Pagination: `--cursor`, `--limit`, `--all`

```bash
nuntly organizations list
```

#### `nuntly organizations retrieve`

Retrieves the organization that the API key belongs to by id, returning its name and its status (enabled or disabled).

Arguments: `<id>`

```bash
nuntly organizations retrieve org_01ka8k8s80gvx9604cn9am5st4
```

### segments

#### `nuntly segments members list`

List the members of a segment.

Arguments: `<segment-id>`

Pagination: `--cursor`, `--limit`, `--all`

```bash
nuntly segments members list seg_01kabn43yqyxn2bx4ve84mczd3
```

#### `nuntly segments create`

Create an organization-level static segment.

Required: `--name`

```bash
nuntly segments create --name "vip customers"
```

#### `nuntly segments delete`

Delete a segment.

Arguments: `<segment-id>`

```bash
nuntly segments delete seg_01kabn43yqyxn2bx4ve84mczd3
```

#### `nuntly segments list`

List the organization segments.

Pagination: `--cursor`, `--limit`, `--all`

```bash
nuntly segments list
```

#### `nuntly segments retrieve`

Retrieve one segment.

Arguments: `<segment-id>`

```bash
nuntly segments retrieve seg_01kabn43yqyxn2bx4ve84mczd3
```

#### `nuntly segments update`

Rename a segment.

Arguments: `<segment-id>`

Required: `--name`

```bash
nuntly segments update seg_01kabn43yqyxn2bx4ve84mczd3 --name "vip customers"
```

### templates

#### `nuntly templates versions create`

Create a draft version of a template.

Arguments: `<template-id>`

Required: `--subject`, `--html`

Optional: `--text`, `--variables` (JSON)

```bash
nuntly templates versions create tpl_01kabn43yqyxn2bx4ve84mczd3 --subject "Verify your email address" --html '<h1>Welcome</h1><p>Thank you for signing up! Please verify your email address.</p>' --text 'Thank you for signing up! Please verify your email address.'
```

#### `nuntly templates versions list`

List the versions of a template.

Arguments: `<template-id>`

Pagination: `--cursor`, `--limit`, `--all`

```bash
nuntly templates versions list tpl_01kabn43yqyxn2bx4ve84mczd3
```

#### `nuntly templates versions publish`

Publish a draft template version.

Arguments: `<template-id>`, `<version-id>`

```bash
nuntly templates versions publish tpl_01kabn43yqyxn2bx4ve84mczd3 tpv_01kabn43yqyxn2bx4ve84mczd3
```

#### `nuntly templates versions retrieve`

Retrieve one content version.

Arguments: `<template-id>`, `<version-id>`

```bash
nuntly templates versions retrieve tpl_01kabn43yqyxn2bx4ve84mczd3 tpv_01kabn43yqyxn2bx4ve84mczd3
```

#### `nuntly templates versions content retrieve`

Get download links for a version's HTML and text.

Arguments: `<template-id>`, `<version-id>`

```bash
nuntly templates versions content retrieve tpl_01kabn43yqyxn2bx4ve84mczd3 tpv_01kabn43yqyxn2bx4ve84mczd3
```

#### `nuntly templates create`

Create a template.

Required: `--name`

```bash
nuntly templates create --name "Welcome email"
```

#### `nuntly templates delete`

Delete a template and its versions.

Arguments: `<template-id>`

```bash
nuntly templates delete tpl_01kabn43yqyxn2bx4ve84mczd3
```

#### `nuntly templates list`

List the organization templates.

Pagination: `--cursor`, `--limit`, `--all`

```bash
nuntly templates list
```

#### `nuntly templates retrieve`

Retrieve one template.

Arguments: `<template-id>`

```bash
nuntly templates retrieve tpl_01kabn43yqyxn2bx4ve84mczd3
```

#### `nuntly templates update`

Rename a template.

Arguments: `<template-id>`

Optional: `--name`

```bash
nuntly templates update tpl_01kabn43yqyxn2bx4ve84mczd3 --name "Welcome email"
```

### threads

#### `nuntly threads messages list`

Lists the messages in a thread in chronological order, oldest first, with cursor pagination. Returns up to 30 messages per page.

Arguments: `<thread-id>`

Pagination: `--cursor`, `--limit`, `--all`

```bash
nuntly threads messages list thr_01kabn43yqyxn2bx4ve84mczd3
```

#### `nuntly threads retrieve`

Retrieves a thread with its subject, message count, last activity and labels from all its messages. Pass markRead=true to clear unread labels.

Arguments: `<thread-id>`

Query: `--mark-read`

```bash
nuntly threads retrieve thr_01kabn43yqyxn2bx4ve84mczd3
```

#### `nuntly threads update`

Adds or removes labels on every message in a thread, or sets its agent. Label operations only work on threads in user-created inboxes.

Arguments: `<thread-id>`

Optional: `--add-labels`, `--remove-labels`, `--agent-id`

```bash
nuntly threads update thr_01kabn43yqyxn2bx4ve84mczd3 --add-labels urgent
```

### topics

#### `nuntly topics memberships list`

List a topic's explicit membership records only. A contact without one is subscribed by default.

Arguments: `<topic-id>`

Pagination: `--cursor`, `--limit`, `--all`

```bash
nuntly topics memberships list tpc_01kabn43yqyxn2bx4ve84mczd3
```

#### `nuntly topics create`

Create a topic.

Required: `--name`

```bash
nuntly topics create --name "product updates"
```

#### `nuntly topics delete`

Delete a topic.

Arguments: `<topic-id>`

```bash
nuntly topics delete tpc_01kabn43yqyxn2bx4ve84mczd3
```

#### `nuntly topics list`

List the organization topics.

Pagination: `--cursor`, `--limit`, `--all`

```bash
nuntly topics list
```

#### `nuntly topics retrieve`

Retrieve one topic.

Arguments: `<topic-id>`

```bash
nuntly topics retrieve tpc_01kabn43yqyxn2bx4ve84mczd3
```

#### `nuntly topics update`

Rename a topic.

Arguments: `<topic-id>`

Required: `--name`

```bash
nuntly topics update tpc_01kabn43yqyxn2bx4ve84mczd3 --name "product updates"
```

### webhooks

#### `nuntly webhooks events list`

Lists the webhook events of the last 48 hours across all your endpoints, with their delivery status and payload. Results use cursor pagination.

Pagination: `--cursor`, `--limit`, `--all`

```bash
nuntly webhooks events list
```

#### `nuntly webhooks events replay`

Queues a new delivery of a past webhook event to the endpoint. The request is accepted asynchronously and returns 202 before the delivery runs.

Arguments: `<id>`, `<event-id>`

```bash
nuntly webhooks events replay wh_01ka8k8s80gvx9604cn9am5st4 evt_01ka8k8s80gvx9604cn9am5st4
```

#### `nuntly webhooks events deliveries list`

Lists the delivery attempts of a webhook event to an endpoint, with the status, HTTP response code, response data, and delivery time of each attempt.

Arguments: `<id>`, `<event-id>`

```bash
nuntly webhooks events deliveries list wh_01ka8k8s80gvx9604cn9am5st4 evt_01ka8k8s80gvx9604cn9am5st4
```

#### `nuntly webhooks create`

Registers an HTTPS endpoint to receive the event types you subscribe to. The response includes the signing secret used to verify webhook payloads.

Required: `--endpoint-url`, `--events`

Optional: `--name`, `--status`

```bash
nuntly webhooks create --name "Production webhook" --endpoint-url https://example.com/webhooks --events email.sent
```

#### `nuntly webhooks delete`

Permanently deletes a webhook endpoint. Events are no longer delivered to its URL after deletion. This cannot be undone.

Arguments: `<id>`

```bash
nuntly webhooks delete wh_01ka8k8s80gvx9604cn9am5st4
```

#### `nuntly webhooks list`

Lists the webhook endpoints of your organization, newest first, with cursor pagination. Each entry shows its URL, event types, and status.

Pagination: `--cursor`, `--limit`, `--all`

```bash
nuntly webhooks list
```

#### `nuntly webhooks retrieve`

Retrieves a webhook endpoint with its URL, subscribed event types, status, and the reason and time it was disabled, if it is disabled.

Arguments: `<id>`

```bash
nuntly webhooks retrieve wh_01ka8k8s80gvx9604cn9am5st4
```

#### `nuntly webhooks update`

Updates the name, URL, event types, or status of a webhook, or rotates its signing secret. The new secret is returned only when you rotate it.

Arguments: `<id>`

Optional: `--name`, `--endpoint-url`, `--events`, `--status`, `--rotate-secret`

```bash
nuntly webhooks update wh_01ka8k8s80gvx9604cn9am5st4 --name "Production webhook" --events email.sent
```
