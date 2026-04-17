export function formatBytes(bytes: number): string {
  if (bytes === 0) {
    return "0 B";
  }
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

export function formatTimestamp(epoch: number): string {
  if (epoch === 0) {
    return "N/A";
  }
  return new Date(epoch * 1000).toISOString();
}

export function getStatusLabel(torrent: {
  state: number;
  is_open: number;
  is_active: number;
  complete: number;
  is_hash_checking: number;
}): string {
  if (torrent.is_hash_checking) {
    return "Hashing";
  }
  if (!torrent.is_open) {
    return "Closed";
  }
  if (!torrent.is_active && torrent.state === 1) {
    return "Paused";
  }
  if (torrent.is_active && torrent.complete) {
    return "Seeding";
  }
  if (torrent.is_active && !torrent.complete) {
    return "Downloading";
  }
  if (!torrent.state) {
    return "Stopped";
  }
  return "Unknown";
}
