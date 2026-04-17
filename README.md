# RTorrent MCP

> **Note:** This project was developed with the help of AI.

[![GitHub latest commit](https://badgen.net/github/last-commit/Ace-Nanter/rtorrent-mcp/main)](https://GitHub.com/Ace-Nanter/rtorrent-mcp/commits/main/)
[![version](https://badgen.net/github/tag/Ace-Nanter/rtorrent-mcp)](https://github.com/Ace-Nanter/rtorrent-mcp/tags)
[![License:MIT](https://badgen.net/github/license/Ace-Nanter/rtorrent-mcp)](https://github.com/Ace-Nanter/rtorrent-mcp/blob/master/LICENSE.md)
[![Node.js](https://img.shields.io/badge/Node.js-24%2B-green)](https://nodejs.org/)
[![MCP](https://img.shields.io/badge/MCP-Streamable%20HTTP-purple)](https://modelcontextprotocol.io/)

A self-hosted [MCP (Model Context Protocol)](https://modelcontextprotocol.io/) server that lets AI assistants manage [rTorrent](https://github.com/crazy-max/docker-rtorrent-rutorrent) via its XML-RPC API.

Expose your rTorrent instance to any MCP-compatible client (Claude Desktop, VS Code Copilot, Open WebUI, OpenClaw, etc.) over Streamable HTTP transport.

## Features

| Tool | Description |
|------|-------------|
| `list_torrents` | List all torrents with name, size, progress, speed, ratio, status, trackers, dates… |
| `get_torrent` | Get full details of a specific torrent including files and trackers |
| `remove_torrent` | Remove a torrent entry (downloaded data is **not** deleted) |
| `add_torrent` | Add a torrent via `.torrent` file (base64) or URL / magnet link |

## Prerequisites

- **rTorrent** with XML-RPC enabled (e.g. via ruTorrent, Flood, or standalone)
- **Node.js 22+** (for local install) or **Docker** (recommended)

## Configuration

| Variable | Required | Description |
|---|---|---|
| `RTORRENT_URL` | **Yes** | XML-RPC endpoint URL (e.g. `http://localhost:8000/RPC2`) |
| `RTORRENT_USERNAME` | No | HTTP Basic auth username |
| `RTORRENT_PASSWORD` | No | HTTP Basic auth password |
| `PORT` | No | HTTP server port (default: `3000`) |

## Installation

### Docker (recommended)

```bash
docker run -d \
  --name rtorrent-mcp \
  -p 3000:3000 \
  -e RTORRENT_URL=http://rtorrent:8000/RPC2 \
  -e RTORRENT_USERNAME=admin \
  -e RTORRENT_PASSWORD=secret \
  rtorrent-mcp
```

#### Docker Compose

```yaml
services:
  rtorrent-mcp:
    image: rtorrent-mcp
    build: .
    ports:
      - "3000:3000"
    environment:
      RTORRENT_URL: http://rtorrent:8000/RPC2
      RTORRENT_USERNAME: admin
      RTORRENT_PASSWORD: secret
    restart: unless-stopped
```

#### Build from source

```bash
git clone https://github.com/admusic/rtorrent-mcp.git
cd rtorrent-mcp
docker build -t rtorrent-mcp .
```

### Local

```bash
git clone https://github.com/admusic/rtorrent-mcp.git
cd rtorrent-mcp

# Install dependencies
pnpm install

# Build
pnpm build

# Run
RTORRENT_URL=http://localhost:8000/RPC2 pnpm start
```

## Connecting an MCP client

The server exposes a single Streamable HTTP endpoint at `/mcp` on the configured port.

### Generic MCP client configuration

```json
{
  "mcpServers": {
    "rtorrent": {
      "url": "http://localhost:3000/mcp"
    }
  }
}
```


## Local development

Install dependencies:
```bash
pnpm install
```

Build the project:
```bash
pnpm build
```

Run the linter:
```bash
pnpm lint
```

You can use MCP Inspector to try out the project without using a LLM:
```bash
npx @modelcontextprotocol/inspector node dist/index.js   
```

## Compatibility
Designed to work with [crazy-max/docker-rtorrent-rutorrent](https://github.com/crazy-max/docker-rtorrent-rutorrent) which exposes the XML-RPC API via nginx on port 8000 (endpoint `/RPC2`).

## Donate

<span align="center">

<br />

[![paypal](https://www.paypalobjects.com/en_US/i/btn/btn_donateCC_LG.gif)](https://www.paypal.com/cgi-bin/webscr?cmd=_s-xclick&hosted_button_id=DX7SKZKNE3E5U)

</span>
