// apps/server/src/index.ts
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { WebSocketServer } from 'ws';
import { StateStore } from './state/store.js';
import { GatewayServer } from './gateway/gateway-server.js';
import { UISyncServer } from './ui/ui-sync.js';
import { RestRouter } from './rest/rest-router.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface ServerOptions {
  port?: number;
  host?: string;
  dataPath?: string;
}

export function startDiscordMockServer(options: ServerOptions = {}) {
  const PORT = options.port || parseInt(process.env.PORT || '3000', 10);
  const HOST = options.host || '127.0.0.1'; // Security rule: always bind to localhost

  const store = new StateStore(options.dataPath);
  const server = http.createServer();

  // WebSockets
  const gatewayWss = new WebSocketServer({ noServer: true });
  const uiWss = new WebSocketServer({ noServer: true });

  const gatewayServer = new GatewayServer(gatewayWss, store, PORT);
  const uiSyncServer = new UISyncServer(uiWss, store, gatewayServer);
  const restRouter = new RestRouter(store, gatewayServer, PORT);

  // Upgrade requests (WebSocket routing)
  server.on('upgrade', (req, socket, head) => {
    const { pathname } = new URL(req.url || '/', `http://${req.headers.host}`);

    if (pathname === '/gateway') {
      gatewayWss.handleUpgrade(req, socket, head, (ws) => {
        gatewayWss.emit('connection', ws, req);
      });
    } else if (pathname === '/ws/ui') {
      uiWss.handleUpgrade(req, socket, head, (ws) => {
        uiWss.emit('connection', ws, req);
      });
    } else {
      socket.destroy();
    }
  });

  // HTTP Request Routing
  server.on('request', async (req, res) => {
    const { pathname } = new URL(req.url || '/', `http://${req.headers.host}`);

    // 1. Check REST API routes
    const handled = await restRouter.handleRequest(req, res);
    if (handled) return;

    // 2. Web UI routes
    if (pathname === '/' || pathname === '/admin' || pathname === '/app') {
      const htmlPath = path.resolve(__dirname, 'ui', 'frontend.html');
      if (fs.existsSync(htmlPath)) {
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(fs.readFileSync(htmlPath, 'utf-8'));
        return;
      }
    }

    // 3. Fallback
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not Found' }));
  });

  server.listen(PORT, HOST, () => {
    console.log(`\n======================================================`);
    console.log(`  ⚡ Discord Mock Flash (Standalone Emulator)`);
    console.log(`  🔒 Security Mode: Local Self-Hosted (${HOST})`);
    console.log(`------------------------------------------------------`);
    console.log(`  🌐 Web UI (Test & Admin):   http://${HOST}:${PORT}`);
    console.log(`  🔌 Discord REST API Base:  http://${HOST}:${PORT}/api/v10`);
    console.log(`  ⚡ Discord Gateway:        ws://${HOST}:${PORT}/gateway`);
    console.log(`======================================================\n`);
  });

  return { server, store, gatewayServer };
}

// Direct CLI execution
if (process.argv[1] && process.argv[1].endsWith('index.ts') || process.argv[1]?.endsWith('index.js')) {
  startDiscordMockServer();
}

