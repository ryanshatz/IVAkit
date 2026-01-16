/**
 * IVAkit API Server
 * 
 * Hono-based API server with tRPC for type-safe endpoints.
 * Built for Bun runtime.
 */

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { trpcServer } from '@hono/trpc-server';
import { appRouter } from './router';
import { createContext } from './context';

const app = new Hono();

// Middleware
app.use('*', logger());
app.use('*', cors({
    origin: ['http://localhost:3000', 'http://localhost:3001'],
    credentials: true,
}));

// Health check
app.get('/health', (c) => c.json({ status: 'ok', timestamp: new Date().toISOString() }));

// API info
app.get('/api', (c) => c.json({
    name: 'IVAkit API',
    version: '0.1.0',
    endpoints: {
        trpc: '/trpc',
        health: '/health',
    },
}));

// tRPC handler
app.use('/trpc/*', trpcServer({
    router: appRouter,
    createContext,
}));

// Start server
const port = Number(process.env.API_PORT) || 3001;

console.log(`
  ╔═══════════════════════════════════════════╗
  ║                                           ║
  ║     🤖  IVAkit API Server                 ║
  ║                                           ║
  ║     Running on http://localhost:${port}      ║
  ║                                           ║
  ╚═══════════════════════════════════════════╝
`);

export default {
    port,
    fetch: app.fetch,
};
