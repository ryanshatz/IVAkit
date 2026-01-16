/**
 * tRPC Context
 */

import type { FetchCreateContextFnOptions } from '@trpc/server/adapters/fetch';
import { db } from '@ivakit/database';
import { FlowEngine, SessionManager } from '@ivakit/runtime';
import { createAIService } from '@ivakit/ai';

// Create runtime services
const sessionManager = new SessionManager();
const aiService = createAIService();

// Simple knowledge service (to be expanded)
const knowledgeService = {
    async search(options: { knowledgeBaseId: string; query: string; topK?: number; minScore?: number }) {
        // Mock implementation - would integrate with vector search
        return {
            results: [],
            answer: "I don't have specific information about that in my knowledge base.",
            confidence: 0.3,
            grounded: false,
        };
    },
};

// Simple tool service (to be expanded)
const toolService = {
    async execute(options: { toolId: string; inputs: Record<string, unknown>; timeout?: number }) {
        // Mock implementation - would make HTTP calls
        return {
            success: true,
            output: { status: 'ok', message: 'Tool executed successfully' },
        };
    },
};

// Create flow engine
const engine = new FlowEngine({
    ai: aiService,
    knowledge: knowledgeService,
    tools: toolService,
    sessions: sessionManager,
});

export type Context = {
    db: typeof db;
    engine: typeof engine;
    sessionManager: typeof sessionManager;
};

export function createContext(opts: FetchCreateContextFnOptions): Context {
    return {
        db,
        engine,
        sessionManager,
    };
}
