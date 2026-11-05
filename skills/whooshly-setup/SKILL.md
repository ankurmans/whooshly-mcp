---
name: whooshly-setup
description: Use when the user wants to create or manage short links, dynamic QR codes, UTM templates, digital business cards (vCards), or hosted landing pages with Whooshly, or asks how to connect, authenticate, or troubleshoot the Whooshly MCP connector.
author: Whooshly
version: 1.1.1
tags:
  - links
  - qr-codes
  - utm
  - vcard
  - landing-pages
  - marketing
---

# Whooshly

Whooshly is a link, QR, and campaign toolkit. This plugin bundles a remote MCP
connection to `https://app.whooshly.co/api/mcp`, so its tools are available
directly once the user has connected an account — no local server to run.

## Connecting an account

Every tool acts on the user's own Whooshly account and requires the one-time
**Core** plan (or Pro) to be unlocked; `get_billing_status` works on any
account so it can be checked before anything else.

Sign-in is handled by Whooshly's own consent screen, so there is nothing to
copy or paste:

- **Claude Code**: run `/mcp`, pick **whooshly**, and choose **Authenticate**.
  A browser window opens; sign in to Whooshly and approve access.
- **Claude.ai / Desktop / mobile**: the consent screen appears the first time a
  tool is called.

If a tool call fails with an authorization error, ask the user to authenticate
again from `/mcp` (Claude Code) or reconnect the connector.

If a tool call fails with `core_locked` or `pro_required`, tell the user what
plan is needed and point them at `https://app.whooshly.co` to upgrade — do not
guess at a workaround.

## What each tool does

- `get_billing_status` — check plan/entitlement before doing anything else.
- `create_link` / `update_link` / `list_links` / `get_link_stats` — short
  links with custom slugs and exact click totals.
- `create_qr` / `get_qr` — a dynamic QR code (a short link whose QR is
  returned as a scannable PNG **image**, not just a URL). Because it's
  dynamic, the destination can change later without reprinting anything.
- `create_utm` / `list_utm` — reusable UTM parameter templates.
- `create_vcard` — a hosted digital business card page.
- `create_page` / `update_page` / `list_pages` / `get_page` — hosted landing
  pages built from content blocks, with lead-capture forms. Creating a page
  requires the account's subdomain to already be claimed once in the app
  (under Funnels) — if a call fails with `no_subdomain`, tell the user to do
  that first, then retry.
- `search` / `fetch` — search the account's existing links and pages, then
  fetch one by id.

No tool deletes anything, and no tool moves money — by design, this
connector never asks for destructive or financial confirmation.

## Example prompts

- "Create a short link for https://example.com/launch with the slug spring-launch and pull its click stats."
- "Make a QR code for our new flyer and show it to me as an image I can scan."
- "Create a UTM template called 'Newsletter' with source=newsletter, medium=email, campaign=weekly-digest."
- "Create a digital business card for our sales rep with their name, title, and phone number."
- "Create a landing page for our webinar with a headline and a signup form, then give me the live URL."
