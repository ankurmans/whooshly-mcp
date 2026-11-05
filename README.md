# Whooshly for Claude

Create short links, dynamic QR codes, UTM templates, hosted vCards and landing pages with lead capture from Claude. This plugin connects Claude to Whooshly's hosted MCP server at `https://app.whooshly.co/api/mcp` and adds a skill that explains how to use it.

## Sign in

Run `/mcp` in Claude Code, select **whooshly**, and choose **Authenticate**. Your browser opens Whooshly's consent screen; sign in and approve. Claude never sees your Whooshly password, and you can revoke access any time from your Whooshly account.

Every tool acts on your own Whooshly account and needs the one-time Core plan (or Pro). The `get_billing_status` tool works on any account.

## Privacy

This plugin sends the requests you make through Claude (for example the URL to shorten or the page content to publish) to Whooshly so it can carry them out. See the [privacy policy](https://whooshly.co/privacy) and [terms](https://whooshly.co/terms).

## Links

- Docs: https://whooshly.co/docs/agents/mcp-quickstart
- Support: https://whooshly.co/contact
- License: MIT
