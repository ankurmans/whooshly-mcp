#!/usr/bin/env node
// whooshly-mcp – a zero-dependency stdio <-> HTTP bridge to the hosted Whooshly MCP server.
//
// Modern clients (claude.ai, ChatGPT) connect to the remote server directly by URL. This bridge exists
// for stdio-only clients (e.g. Claude Desktop) and for `npx` ergonomics: it reads newline-delimited
// JSON-RPC from stdin, forwards each message to https://app.whooshly.co/api/mcp with your agent token,
// and writes the correlated reply to stdout. Node 18+ built-ins only – no npm dependencies.

import { createInterface } from "node:readline";

const ENDPOINT = process.env.WHOOSHLY_MCP_URL || "https://app.whooshly.co/api/mcp";
const TOKEN = process.env.WHOOSHLY_TOKEN || process.env.WHOOSHLY_API_TOKEN || "";
const TIMEOUT_MS = 30_000; // a little above the server's ~25s internal request timeout

// A stdio MCP server must write ONLY valid JSON-RPC to stdout; a closed read-end (client gone) surfaces
// as EPIPE, which is normal end-of-session, not a crash. Never let a stray rejection tear down the loop.
process.stdout.on("error", () => process.exit(0));
process.on("unhandledRejection", () => {});
process.on("uncaughtException", (e) => {
  try {
    process.stderr.write(`whooshly-mcp: ${(e && e.message) || e}\n`);
  } catch {
    /* stderr itself is gone; nothing more we can do */
  }
});

/** Write one JSON-RPC message as a single newline-delimited line; resolves once it's flushed (or errored). */
const write = (msg) => new Promise((resolve) => process.stdout.write(JSON.stringify(msg) + "\n", () => resolve()));

const rpcError = (id, code, message) => ({ jsonrpc: "2.0", id: id ?? null, error: { code, message } });

// A JSON-RPC *request* has both a method and a non-null id; notifications/responses have no reply to
// correlate. A batch is an array; it expects a reply iff it contains at least one request.
const isRequest = (m) => m != null && typeof m === "object" && typeof m.method === "string" && m.id != null;

/**
 * The reply to emit when forwarding fails. For a single request -> one error object; for a batch ->
 * an array of per-id errors (one per contained request) so batched calls never hang; otherwise null
 * (notifications and responses expect nothing back).
 */
function errorReplyFor(msg, code, message) {
  if (Array.isArray(msg)) {
    const errs = msg.filter(isRequest).map((m) => rpcError(m.id, code, message));
    return errs.length ? errs : null;
  }
  return isRequest(msg) ? rpcError(msg.id, code, message) : null;
}

/** Forward one inbound JSON-RPC message (or batch) to the remote; return its reply, or null when there's nothing to emit. */
async function forward(msg) {
  if (!TOKEN) {
    return errorReplyFor(
      msg,
      -32001,
      "whooshly-mcp: no WHOOSHLY_TOKEN set. Mint an agent token at https://app.whooshly.co (Agents) and add it to this server's env.",
    );
  }

  let res;
  try {
    res = await fetch(ENDPOINT, {
      method: "POST",
      headers: { "content-type": "application/json", accept: "application/json", authorization: `Bearer ${TOKEN}` },
      body: JSON.stringify(msg),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch (e) {
    const detail = e && e.name === "TimeoutError" ? `timed out after ${TIMEOUT_MS}ms` : `network error: ${e && e.message}`;
    return errorReplyFor(msg, -32603, `whooshly-mcp: ${detail} reaching ${ENDPOINT}`);
  }

  // 202/204 = notification accepted, no body to relay.
  if (res.status === 202 || res.status === 204) return null;

  const bodyText = await res.text().catch(() => "");

  if (res.status === 401 || res.status === 403) {
    // Token rejected/expired. Give the human a fix, keyed to the request id(s) so the client shows it.
    return errorReplyFor(
      msg,
      -32001,
      `whooshly-mcp: server rejected the token (HTTP ${res.status}). Mint a fresh one at https://app.whooshly.co (Agents).`,
    );
  }

  if (!bodyText) return errorReplyFor(msg, -32603, `whooshly-mcp: empty response (HTTP ${res.status}) from ${ENDPOINT}`);

  try {
    return JSON.parse(bodyText);
  } catch {
    return errorReplyFor(msg, -32603, `whooshly-mcp: non-JSON response (HTTP ${res.status}) from ${ENDPOINT}`);
  }
}

if (!TOKEN) {
  // Don't crash the client on startup – surface a clear, actionable JSON-RPC error per request instead.
  process.stderr.write(
    "whooshly-mcp: WHOOSHLY_TOKEN is not set. Mint an agent token at https://app.whooshly.co (Agents -> New token) " +
      "and add it to this server's `env` in your MCP client config.\n",
  );
}

const rl = createInterface({ input: process.stdin, crlfDelay: Infinity });

// Track in-flight work (forward + its stdout write) so a stdin close (one-shot `echo | whooshly-mcp`, or
// client shutdown) waits for every reply to be fully flushed before the process exits.
const inflight = new Set();
const track = (p) => {
  const wrapped = p.catch(() => {}); // a failed forward/write must never become an unhandled rejection
  inflight.add(wrapped);
  wrapped.finally(() => inflight.delete(wrapped));
};

rl.on("line", (line) => {
  const trimmed = line.trim();
  if (!trimmed) return;
  let msg;
  try {
    msg = JSON.parse(trimmed);
  } catch {
    track(write(rpcError(null, -32700, "Parse error")));
    return;
  }
  // Fire each forward independently; JSON-RPC correlates replies by id, so out-of-order completion is fine.
  track(forward(msg).then((reply) => (reply ? write(reply) : undefined)));
});

// Don't force-exit: draining inflight guarantees writes are flushed, then the empty event loop exits on
// its own with code 0. process.exit() here could truncate a buffered final line (e.g. a large QR PNG).
rl.on("close", () => {
  Promise.allSettled([...inflight]).then(() => {
    process.exitCode = 0;
  });
});
