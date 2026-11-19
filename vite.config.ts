import type { IncomingMessage, ServerResponse } from 'node:http';
import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv, type Plugin } from 'vite';
import {
  handleDecisionsPost,
  sendDecisionsError,
  sendJsonResponse,
} from './server/decisionsProxy.js';

interface MiddlewareHost {
  middlewares: {
    use: (
      fn: (
        req: IncomingMessage,
        res: ServerResponse,
        next: () => void,
      ) => void,
    ) => unknown;
  };
}

function decisionsApiServerProxy(env: Record<string, string>): Plugin {
  const attachMiddleware = (server: MiddlewareHost) => {
    server.middlewares.use(
      (req: IncomingMessage, res: ServerResponse, next: () => void) => {
        const pathname = (req.url || '').split('?')[0];
        if (pathname === '/api/health' && req.method === 'GET') {
          sendJsonResponse(res, 200, { status: 'ok' });
          return;
        }
        if (pathname !== '/api/decisions') {
          next();
          return;
        }
        if (req.method !== 'POST') {
          sendDecisionsError(
            res,
            405,
            'METHOD_NOT_ALLOWED',
            'Method not allowed. Use POST /api/decisions.',
          );
          return;
        }
        void handleDecisionsPost(req, res, { env });
      },
    );
  };

  return {
    name: 'decisions-api-server-proxy',
    configureServer(server: MiddlewareHost) {
      attachMiddleware(server);
    },
    configurePreviewServer(server: MiddlewareHost) {
      attachMiddleware(server);
    },
  };
}

export default defineConfig(({ mode }: { mode: string }) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [react(), decisionsApiServerProxy(env)],
    server: {
      port: 3000,
      host: '0.0.0.0',
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
