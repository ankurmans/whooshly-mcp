# Whooshly MCP

Give your AI assistant a campaign-link toolkit. **[Whooshly](https://whooshly.co)** exposes a hosted [Model Context Protocol](https://modelcontextprotocol.io) server so Claude, ChatGPT, and any MCP client can create short links, dynamic **QR codes**, **UTM** templates, hosted **vCard** pages, and **landing pages** with lead capture – and read back real click/scan analytics – directly from a conversation.

> "Shorten this launch URL, make a QR for the flyer, and save a UTM template for the paid-social campaign" → three tools, one message, links you actually own.

- 🔗 **Short links** on `whooshly.co` with live click tracking
- 🟧 **Dynamic QR codes** returned as scannable PNGs, right in the chat
- 🏷️ **UTM templates** you can reuse across campaigns
- 📇 **Hosted vCard** digital business cards
- 📊 **Real analytics** – exact click/scan totals and daily series per link
- 💸 **Pay once.** Unlock the core toolkit for a one-time price – no subscription. [See pricing →](https://whooshly.co)

The server is **hosted** – there's nothing to run for URL-based clients. This npm package is a small **stdio bridge** for clients that don't yet speak remote MCP (e.g. Claude Desktop) and for `npx` convenience.

---

## 1. Get an agent token

Every tool acts on **your** Whooshly account, so you need a token:

1. Sign in at **[app.whooshly.co](https://app.whooshly.co)**
2. Open **Agents → New token**
3. Copy the token (shown once)

Reads and writes require the one-time **Core** unlock; `get_billing_status` works on any account so an agent can check before it acts.

---

## 2. Connect

### Claude.ai / Claude (web, desktop, mobile) – by URL, no install

Add a **Custom Connector** pointing at the remote server. Claude runs the OAuth flow in-browser; approve it and the tools appear.

```
https://app.whooshly.co/api/mcp
```

*Settings → Connectors → Add custom connector → paste the URL.*

### ChatGPT – by URL

Add a connector / custom MCP server with the same URL:

```
https://app.whooshly.co/api/mcp
```

### Claude Code – one command

```bash
claude mcp add whooshly --transport http https://app.whooshly.co/api/mcp
```

Then authenticate with `/mcp` inside Claude Code, or pass a token header:

```bash
claude mcp add whooshly --transport http https://app.whooshly.co/api/mcp \
  --header "Authorization: Bearer $WHOOSHLY_TOKEN"
```

### Claude Desktop (or any stdio client) – via this bridge

For clients that only speak stdio, use this package. Add it to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "whooshly": {
      "command": "npx",
      "args": ["-y", "whooshly-mcp"],
      "env": {
        "WHOOSHLY_TOKEN": "your-agent-token"
      }
    }
  }
}
```

That's it – restart the client and the Whooshly tools are available.

---

## Tools

| Tool | What it does | Access |
| --- | --- | --- |
| `get_billing_status` | Check whether the account has unlocked Core / Pro | any |
| `create_link` | Create a short link → id, slug, short URL | Core |
| `list_links` | List your links, newest first (cursor-paged) | Core |
| `get_link_stats` | Exact click/scan totals + daily series for a link | Core |
| `create_qr` | Create a dynamic QR code, returned as a scannable PNG | Core |
| `get_qr` | Re-fetch a saved QR code as a PNG | Core |
| `create_utm` | Save a reusable UTM template | Core |
| `list_utm` | List saved UTM templates | Core |
| `create_vcard` | Create a hosted digital business card (vCard) page | Core |
| `create_page` | Create a landing page on your subdomain from content blocks | Core |
| `update_page` | Edit a page's blocks, theme, or slug – never deletes | Core |
| `list_pages` | List your landing pages with lead counts | Core |
| `get_page` | One page's content, lead count & webhook delivery rollup | Core |
| `search` | Search your links by slug/destination (deep-research) | Core |
| `fetch` | Fetch full details of one link by id (deep-research) | Core |

All read tools are annotated `readOnlyHint`; write tools can only create or edit – an agent can never delete anything, never read your leads' personal details (counts only), and never see or change a lead webhook. Every tool operates only on your own account (`openWorldHint: false`).

---

## Example prompts

Once connected, try:

- *"Shorten https://example.com/2026-summer-launch with the slug `summer26` and show me the QR code."*
- *"Create a UTM template called `paid-social` with source `instagram`, medium `cpc`, campaign `summer-launch`."*
- *"How many clicks did my `summer26` link get this week?"*
- *"Make a vCard for Jane Doe, Head of Growth at Acme, jane@acme.com."*

---

## Configuration

| Env var | Default | Purpose |
| --- | --- | --- |
| `WHOOSHLY_TOKEN` | – | **Required** for the stdio bridge. Your agent token. |
| `WHOOSHLY_MCP_URL` | `https://app.whooshly.co/api/mcp` | Override the endpoint (self-host / staging). |

`WHOOSHLY_API_TOKEN` is accepted as an alias for `WHOOSHLY_TOKEN`.

---

## How the bridge works

`whooshly-mcp` reads newline-delimited JSON-RPC from stdin, POSTs each message to the hosted server with your bearer token, and writes the correlated reply to stdout. It has **zero npm dependencies** (Node 18+ built-ins only), so it's small and easy to audit – the entire bridge is one file: [`bin/whooshly-mcp.mjs`](bin/whooshly-mcp.mjs).

The heavy lifting – auth, rate limits, entitlement checks, QR rendering, analytics – all happens server-side on [Whooshly](https://whooshly.co). The bridge is a transport shim, nothing more.

---

## Links

- **Website:** https://whooshly.co
- **MCP server / connect guide:** https://whooshly.co/mcp
- **App / dashboard:** https://app.whooshly.co
- **MCP endpoint:** `https://app.whooshly.co/api/mcp`

## License

[MIT](LICENSE) © Whooshly
