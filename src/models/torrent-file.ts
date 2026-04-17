export interface TorrentFile {
  path: string;
  size_bytes: number;
  completed_chunks: number;
  size_chunks: number;
  priority: number;
}
