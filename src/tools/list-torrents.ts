import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { RTorrentClient } from "../rtorrent-client.js";
import { formatBytes, formatTimestamp, getStatusLabel } from "../utils.js";

export function registerListTorrents(
  server: McpServer,
  rtorrent: RTorrentClient
): void {
  server.registerTool(
    "list_torrents",
    {
      description:
        "List all torrents with detailed information (name, size, progress, speed, ratio, status, etc.)",
      annotations: {
        readOnlyHint: true,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    async () => {
      try {
        const torrents = await rtorrent.listTorrents();

        if (torrents.length === 0) {
          return { content: [{ type: "text", text: "No torrents found." }] };
        }

        const summary = torrents.map((t) => {
          const progress =
            t.size_bytes > 0
              ? ((t.completed_bytes / t.size_bytes) * 100).toFixed(1)
              : "0.0";
          const ratio = (t.ratio / 1000).toFixed(3);
          const status = getStatusLabel(t);

          return [
            `📦 ${t.name}`,
            `   Hash: ${t.hash}`,
            `   Status: ${status} | Progress: ${progress}%`,
            `   Size: ${formatBytes(t.size_bytes)} | Downloaded: ${formatBytes(t.completed_bytes)}`,
            `   Down: ${formatBytes(t.down_rate)}/s | Up: ${formatBytes(t.up_rate)}/s`,
            `   Total Down: ${formatBytes(t.down_total)} | Total Up: ${formatBytes(t.up_total)}`,
            `   Ratio: ${ratio} | Peers: ${t.peers_connected}`,
            `   Priority: ${t.priority_str} | Private: ${t.is_private ? "Yes" : "No"}`,
            `   Trackers: ${t.trackers.length > 0 ? t.trackers.join(", ") : "None"}`,
            `   Added: ${formatTimestamp(t.load_date)} | Created: ${formatTimestamp(t.creation_date)}`,
            `   Started: ${formatTimestamp(t.timestamp_started)} | Finished: ${formatTimestamp(t.timestamp_finished)}`,
            `   Directory: ${t.directory}`,
            t.message ? `   Message: ${t.message}` : null,
          ]
            .filter(Boolean)
            .join("\n");
        });

        const text = `Found ${torrents.length} torrent(s):\n\n${summary.join("\n\n")}`;
        return { content: [{ type: "text", text }] };
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Unknown error";
        return {
          content: [
            { type: "text", text: `Error listing torrents: ${message}` },
          ],
          isError: true,
        };
      }
    }
  );
}
