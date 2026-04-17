import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { RTorrentClient } from "../rtorrent-client.js";

export function registerAddTorrent(
  server: McpServer,
  rtorrent: RTorrentClient
): void {
  server.registerTool(
    "add_torrent",
    {
      description:
        "Add a new torrent to rTorrent. Provide either a base64-encoded .torrent file or a URL (http/https/magnet).",
      inputSchema: {
        torrent_data: z
          .string()
          .optional()
          .describe(
            "Base64-encoded content of a .torrent file. Provide this OR torrent_url."
          ),
        torrent_url: z
          .string()
          .optional()
          .describe(
            "URL to a .torrent file or a magnet link. Provide this OR torrent_data."
          ),
        start_immediately: z
          .boolean()
          .optional()
          .default(true)
          .describe(
            "Whether to start the torrent immediately after adding (default: true)"
          ),
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: true,
      },
    },
    async ({ torrent_data, torrent_url, start_immediately }) => {
      try {
        if (!torrent_data && !torrent_url) {
          return {
            content: [
              {
                type: "text",
                text: "Error: You must provide either torrent_data (base64) or torrent_url.",
              },
            ],
            isError: true,
          };
        }

        let result: string;
        if (torrent_data) {
          result = await rtorrent.addTorrent(torrent_data, start_immediately);
        } else {
          result = await rtorrent.addTorrentUrl(torrent_url as string, start_immediately);
        }

        return {
          content: [
            {
              type: "text",
              text: `${result}\nStart immediately: ${start_immediately ? "Yes" : "No"}`,
            },
          ],
        };
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Unknown error";
        return {
          content: [
            { type: "text", text: `Error adding torrent: ${message}` },
          ],
          isError: true,
        };
      }
    }
  );
}
