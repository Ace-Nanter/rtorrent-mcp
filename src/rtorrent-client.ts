import xmlrpc from "xmlrpc";
import type { TorrentInfo } from "./models/torrent-info";
import type { TorrentFile } from "./models/torrent-file";
import type { TorrentTracker } from "./models/torrent-tracker";

export class RTorrentClient {
  private client: xmlrpc.Client;

  constructor(url: string, username?: string, password?: string) {
    this.client = this.initializeClient(url, username, password);
  }

  private initializeClient(url: string, username?: string, password?: string): xmlrpc.Client {
    const parsedUrl = new URL(url);

    const isHttps = parsedUrl.protocol === "https:";

    const options: {
      host: string;
      port: number;
      path: string;
      basic_auth?: { user: string; pass: string };
    } = {
      host: parsedUrl.hostname,
      port: parseInt(parsedUrl.port) || (isHttps ? 443 : 80),
      path: parsedUrl.pathname || "/RPC2",
    };

    if (username && password) {
      options.basic_auth = { user: username, pass: password };
    }

    return isHttps ? xmlrpc.createSecureClient(options) : xmlrpc.createClient(options);
  }

  private call(method: string, params: unknown[] = []): Promise<unknown> {
    return new Promise((resolve, reject) => {
      this.client.methodCall(method, params, (error, value) => {
        if (error) {
          reject(error);
        } else {
          resolve(value);
        }
      });
    });
  }

  async listTorrents(): Promise<TorrentInfo[]> {
    const result = (await this.call("d.multicall2", [
      "",
      "main",
      "d.hash=",
      "d.name=",
      "d.size_bytes=",
      "d.completed_bytes=",
      "d.down.rate=",
      "d.up.rate=",
      "d.down.total=",
      "d.up.total=",
      "d.ratio=",
      "d.state=",
      "d.is_open=",
      "d.is_active=",
      "d.complete=",
      "d.is_hash_checking=",
      "d.is_multi_file=",
      "d.peers_connected=",
      "d.directory=",
      "d.creation_date=",
      "d.load_date=",
      "d.left_bytes=",
      "d.chunks_hashed=",
      "d.size_chunks=",
      "d.completed_chunks=",
      "d.priority=",
      "d.priority_str=",
      "d.message=",
      "d.is_private=",
      "d.timestamp.started=",
      "d.timestamp.finished=",
      "d.tracker_size=",
    ])) as unknown[][];

    const torrents = result.map((row) => ({
      hash: row[0] as string,
      name: row[1] as string,
      size_bytes: row[2] as number,
      completed_bytes: row[3] as number,
      down_rate: row[4] as number,
      up_rate: row[5] as number,
      down_total: row[6] as number,
      up_total: row[7] as number,
      ratio: row[8] as number,
      state: row[9] as number,
      is_open: row[10] as number,
      is_active: row[11] as number,
      complete: row[12] as number,
      is_hash_checking: row[13] as number,
      is_multi_file: row[14] as number,
      peers_connected: row[15] as number,
      directory: row[16] as string,
      creation_date: row[17] as number,
      load_date: row[18] as number,
      left_bytes: row[19] as number,
      chunks_hashed: row[20] as number,
      size_chunks: row[21] as number,
      completed_chunks: row[22] as number,
      priority: row[23] as number,
      priority_str: row[24] as string,
      message: row[25] as string,
      is_private: row[26] as number,
      timestamp_started: row[27] as number,
      timestamp_finished: row[28] as number,
      tracker_size: row[29] as number,
      trackers: [] as string[],
    }));

    const trackerResults = await Promise.all(
      torrents.map((t) =>
        this.call("t.multicall", [t.hash, "", "t.url="]).then(
          (res) => (res as string[][]).map((r) => r[0]),
          () => []
        )
      )
    );

    for (let i = 0; i < torrents.length; i++) {
      torrents[i].trackers = trackerResults[i];
    }

    return torrents;
  }

  async getTorrent(hash: string): Promise<TorrentInfo> {
    const sanitized = hash.toUpperCase().replace(/[^A-F0-9]/g, "");

    const [results, trackerUrls] = await Promise.all([
      Promise.all([
        this.call("d.name", [sanitized]),
        this.call("d.size_bytes", [sanitized]),
        this.call("d.completed_bytes", [sanitized]),
        this.call("d.down.rate", [sanitized]),
        this.call("d.up.rate", [sanitized]),
        this.call("d.down.total", [sanitized]),
        this.call("d.up.total", [sanitized]),
        this.call("d.ratio", [sanitized]),
        this.call("d.state", [sanitized]),
        this.call("d.is_open", [sanitized]),
        this.call("d.is_active", [sanitized]),
        this.call("d.complete", [sanitized]),
        this.call("d.is_hash_checking", [sanitized]),
        this.call("d.is_multi_file", [sanitized]),
        this.call("d.peers_connected", [sanitized]),
        this.call("d.directory", [sanitized]),
        this.call("d.creation_date", [sanitized]),
        this.call("d.load_date", [sanitized]),
        this.call("d.left_bytes", [sanitized]),
        this.call("d.chunks_hashed", [sanitized]),
        this.call("d.size_chunks", [sanitized]),
        this.call("d.completed_chunks", [sanitized]),
        this.call("d.priority", [sanitized]),
        this.call("d.priority_str", [sanitized]),
        this.call("d.message", [sanitized]),
        this.call("d.is_private", [sanitized]),
        this.call("d.timestamp.started", [sanitized]),
        this.call("d.timestamp.finished", [sanitized]),
        this.call("d.tracker_size", [sanitized]),
      ]),
      this.call("t.multicall", [sanitized, "", "t.url="]).then(
        (res) => (res as string[][]).map((r) => r[0]),
        () => []
      ),
    ]);

    return {
      hash: sanitized,
      name: results[0] as string,
      size_bytes: results[1] as number,
      completed_bytes: results[2] as number,
      down_rate: results[3] as number,
      up_rate: results[4] as number,
      down_total: results[5] as number,
      up_total: results[6] as number,
      ratio: results[7] as number,
      state: results[8] as number,
      is_open: results[9] as number,
      is_active: results[10] as number,
      complete: results[11] as number,
      is_hash_checking: results[12] as number,
      is_multi_file: results[13] as number,
      peers_connected: results[14] as number,
      directory: results[15] as string,
      creation_date: results[16] as number,
      load_date: results[17] as number,
      left_bytes: results[18] as number,
      chunks_hashed: results[19] as number,
      size_chunks: results[20] as number,
      completed_chunks: results[21] as number,
      priority: results[22] as number,
      priority_str: results[23] as string,
      message: results[24] as string,
      is_private: results[25] as number,
      timestamp_started: results[26] as number,
      timestamp_finished: results[27] as number,
      tracker_size: results[28] as number,
      trackers: trackerUrls as string[],
    };
  }

  async getTorrentFiles(hash: string): Promise<TorrentFile[]> {
    const sanitized = hash.toUpperCase().replace(/[^A-F0-9]/g, "");

    const result = (await this.call("f.multicall", [
      sanitized,
      "",
      "f.path=",
      "f.size_bytes=",
      "f.completed_chunks=",
      "f.size_chunks=",
      "f.priority=",
    ])) as unknown[][];

    return result.map((row) => ({
      path: row[0] as string,
      size_bytes: row[1] as number,
      completed_chunks: row[2] as number,
      size_chunks: row[3] as number,
      priority: row[4] as number,
    }));
  }

  async getTorrentTrackers(hash: string): Promise<TorrentTracker[]> {
    const sanitized = hash.toUpperCase().replace(/[^A-F0-9]/g, "");

    const result = (await this.call("t.multicall", [
      sanitized,
      "",
      "t.url=",
      "t.type=",
      "t.is_enabled=",
      "t.scrape_complete=",
      "t.scrape_incomplete=",
      "t.scrape_downloaded=",
    ])) as unknown[][];

    return result.map((row) => ({
      url: row[0] as string,
      type: row[1] as number,
      is_enabled: row[2] as number,
      scrape_complete: row[3] as number,
      scrape_incomplete: row[4] as number,
      scrape_downloaded: row[5] as number,
    }));
  }

  async removeTorrent(hash: string): Promise<void> {
    const sanitized = hash.toUpperCase().replace(/[^A-F0-9]/g, "");

    // Stop the torrent first if it's active, then erase
    try {
      await this.call("d.stop", [sanitized]);
      await this.call("d.close", [sanitized]);
    } catch {
      // Ignore errors if already stopped/closed
    }
    await this.call("d.erase", [sanitized]);
  }

  async addTorrent(
    torrentData: string,
    startImmediately: boolean = true
  ): Promise<string> {
    // torrentData should be base64 encoded .torrent file content
    const buffer = Buffer.from(torrentData, "base64");

    if (startImmediately) {
      await this.call("load.raw_start", ["", buffer]);
    } else {
      await this.call("load.raw", ["", buffer]);
    }

    return "Torrent added successfully";
  }

  async addTorrentUrl(
    url: string,
    startImmediately: boolean = true
  ): Promise<string> {
    if (startImmediately) {
      await this.call("load.start", ["", url]);
    } else {
      await this.call("load.normal", ["", url]);
    }

    return "Torrent added successfully from URL";
  }

  async getSystemInfo(): Promise<Record<string, unknown>> {
    const [clientVersion, libraryVersion, apiVersion] = await Promise.all([
      this.call("system.client_version"),
      this.call("system.library_version"),
      this.call("system.api_version"),
    ]);

    return {
      client_version: clientVersion,
      library_version: libraryVersion,
      api_version: apiVersion,
    };
  }
}
