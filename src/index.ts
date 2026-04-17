import { randomUUID } from "node:crypto";
import express from "express";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { RTorrentClient } from "./rtorrent-client.js";
import { registerListTorrents } from "./tools/list-torrents.js";
import { registerGetTorrent } from "./tools/get-torrent.js";
import { registerRemoveTorrent } from "./tools/remove-torrent.js";
import { registerAddTorrent } from "./tools/add-torrent.js";


function initializeClient(): RTorrentClient {
  const RTORRENT_URL = process.env.RTORRENT_URL;
  const RTORRENT_USERNAME = process.env.RTORRENT_USERNAME;
  const RTORRENT_PASSWORD = process.env.RTORRENT_PASSWORD;

  if (!RTORRENT_URL) {
    console.error("RTORRENT_URL environment variable is required");
    process.exit(1);
  }

  const rtorrentClient = new RTorrentClient(
    RTORRENT_URL,
    RTORRENT_USERNAME,
    RTORRENT_PASSWORD
  );

  rtorrentClient.getSystemInfo().catch((error) => {
    console.error("Failed to connect to rTorrent. Please check your RTORRENT_URL, RTORRENT_USERNAME, and RTORRENT_PASSWORD environment variables.");
    console.error("Connection error:", error);
    process.exit(1);
  });
  
  return rtorrentClient;
}

function createMcpServer(rtorrentClient: RTorrentClient): McpServer {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { version } = require("../package.json") as { version: string };

  const server = new McpServer({
    name: "rtorrent-mcp",
    version,
  });

  registerListTorrents(server, rtorrentClient);
  registerGetTorrent(server, rtorrentClient);
  registerRemoveTorrent(server, rtorrentClient);
  registerAddTorrent(server, rtorrentClient);

  return server;
}

async function main() {
  const PORT = parseInt(process.env.PORT || "3000", 10);

  const app = express();
  app.use(express.json());

  const transports = new Map<string, StreamableHTTPServerTransport>();

  app.all("/mcp", async (req, res) => {
    const sessionId = req.headers["mcp-session-id"] as string | undefined;

    if (req.method === "POST" && !sessionId) {
      const transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: () => randomUUID(),
        onsessioninitialized: (id) => {
          transports.set(id, transport);
        },
      });

      const rtorrentClient = initializeClient();
      const server = createMcpServer(rtorrentClient);
      await server.connect(transport);
      await transport.handleRequest(req, res, req.body);
      return;
    }

    const existingTransport = sessionId ? transports.get(sessionId) : undefined;
    if (existingTransport) {
      await existingTransport.handleRequest(req, res, req.body);

      if (req.method === "DELETE" && sessionId) {
        transports.delete(sessionId);
      }
      return;
    }

    res.status(400).json({ error: "Invalid or missing session" });
  });

  app.listen(PORT, () => {
    // eslint-disable-next-line no-console
    console.info(`rTorrent MCP server listening on port ${PORT}`);
  });
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});


