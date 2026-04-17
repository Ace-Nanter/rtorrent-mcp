import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { RTorrentClient } from "../rtorrent-client.js";

export function registerRemoveTorrent(
  server: McpServer,
  rtorrent: RTorrentClient
): void {
  server.registerTool(
    "remove_torrent",
    {
      description:
        "Remove a torrent from rTorrent. This stops and erases the torrent entry but does NOT delete downloaded data files.",
      inputSchema: {
        hash: z
          .string()
          .describe(
            "The info hash of the torrent to remove (40-character hex string)"
          ),
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: true,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    async ({ hash }) => {
      try {
        // Get torrent name before removing for confirmation
        let torrentName = hash;
        try {
          const torrent = await rtorrent.getTorrent(hash);
          torrentName = torrent.name;
        } catch {
          // If we can't get the name, just use the hash
        }

        await rtorrent.removeTorrent(hash);

        return {
          content: [
            {
              type: "text",
              text: `Torrent "${torrentName}" (${hash.toUpperCase()}) has been removed successfully.\nNote: Downloaded data files were NOT deleted.`,
            },
          ],
        };
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Unknown error";
        return {
          content: [
            { type: "text", text: `Error removing torrent: ${message}` },
          ],
          isError: true,
        };
      }
    }
  );
}
