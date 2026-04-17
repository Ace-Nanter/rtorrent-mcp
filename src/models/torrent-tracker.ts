export interface TorrentTracker {
  url: string;
  type: number;
  is_enabled: number;
  scrape_complete: number;
  scrape_incomplete: number;
  scrape_downloaded: number;
}
