import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { RTorrentClient } from "../rtorrent-client.js";
import { formatBytes, formatTimestamp, getStatusLabel } from "../utils.js";

export function registerGetTorrent(
  server: McpServer,
  rtorrent: RTorrentClient
): void {
  server.registerTool(
    "get_torrent",
    {
      description:
        "Get detailed information about a specific torrent including files and trackers",
      inputSchema: {
        hash: z
          .string()
          .describe("The info hash of the torrent (40-character hex string)"),
      },
      annotations: {
        readOnlyHint: true,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    async ({ hash }) => {
      try {
        const [torrent, files, trackers] = await Promise.all([
          rtorrent.getTorrent(hash),
          rtorrent.getTorrentFiles(hash),
          rtorrent.getTorrentTrackers(hash),
        ]);

        const progress =
          torrent.size_bytes > 0
            ? ((torrent.completed_bytes / torrent.size_bytes) * 100).toFixed(1)
            : "0.0";
        const ratio = (torrent.ratio / 1000).toFixed(3);
        const status = getStatusLabel(torrent);

        const filesList = files
          .map(
            (f) =>
              `  - ${f.path} (${formatBytes(f.size_bytes)}, priority: ${f.priority}, progress: ${f.size_chunks > 0 ? ((f.completed_chunks / f.size_chunks) * 100).toFixed(1) : 0}%)`
          )
          .join("\n");

        const trackerTypes: Record<number, string> = {
          1: "HTTP",
          2: "UDP",
          3: "DHT",
        };
        const trackersList = trackers
          .map(
            (t) =>
              `  - ${t.url} (${trackerTypes[t.type] || "Unknown"}, enabled: ${t.is_enabled ? "Yes" : "No"}, seeds: ${t.scrape_complete}, leechers: ${t.scrape_incomplete})`
          )
          .join("\n");

        const text = [
          `📦 ${torrent.name}`,
          ``,
          `── General ──`,
          `Hash: ${torrent.hash}`,
          `Status: ${status}`,
          `Progress: ${progress}%`,
          `Size: ${formatBytes(torrent.size_bytes)}`,
          `Downloaded: ${formatBytes(torrent.completed_bytes)}`,
          `Remaining: ${formatBytes(torrent.left_bytes)}`,
          ``,
          `── Transfer ──`,
          `Down Rate: ${formatBytes(torrent.down_rate)}/s`,
          `Up Rate: ${formatBytes(torrent.up_rate)}/s`,
          `Total Downloaded: ${formatBytes(torrent.down_total)}`,
          `Total Uploaded: ${formatBytes(torrent.up_total)}`,
          `Ratio: ${ratio}`,
          `Peers Connected: ${torrent.peers_connected}`,
          ``,
          `── Properties ──`,
          `Priority: ${torrent.priority_str} (${torrent.priority})`,
          `Private: ${torrent.is_private ? "Yes" : "No"}`,
          `Multi-file: ${torrent.is_multi_file ? "Yes" : "No"}`,
          `Directory: ${torrent.directory}`,
          `Chunks: ${torrent.completed_chunks}/${torrent.size_chunks}`,
          ``,
          `── Dates ──`,
          `Created: ${formatTimestamp(torrent.creation_date)}`,
          `Added: ${formatTimestamp(torrent.load_date)}`,
          `Started: ${formatTimestamp(torrent.timestamp_started)}`,
          `Finished: ${formatTimestamp(torrent.timestamp_finished)}`,
          ``,
          torrent.message ? `Message: ${torrent.message}\n` : "",
          `── Files (${files.length}) ──`,
          filesList || "  No files",
          ``,
          `── Trackers (${trackers.length}) ──`,
          trackersList || "  No trackers",
        ].join("\n");

        return { content: [{ type: "text", text }] };
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Unknown error";
        return {
          content: [
            {
              type: "text",
              text: `Error getting torrent details: ${message}`,
            },
          ],
          isError: true,
        };
      }
    }
  );
}
