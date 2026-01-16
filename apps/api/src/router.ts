/**
 * tRPC Router
 * 
 * Type-safe API endpoints for IVAkit.
 */

import { initTRPC } from '@trpc/server';
import { z } from 'zod';
import superjson from 'superjson';
import { eq } from 'drizzle-orm';
import type { Context } from './context';
import { flows, sessions, knowledgeBases, analyticsDaily } from '@ivakit/database';
import { FlowDefinitionSchema } from '@ivakit/shared';

const t = initTRPC.context<Context>().create({
    transformer: superjson,
});

const router = t.router;
const publicProcedure = t.procedure;

// ============================================================================
// Flows Router
// ============================================================================

const flowsRouter = router({
    // List all flows
    list: publicProcedure.query(async ({ ctx }) => {
        return ctx.db.select().from(flows).all();
    }),

    // Get a single flow
    get: publicProcedure
        .input(z.object({ id: z.string() }))
        .query(async ({ ctx, input }) => {
            const result = await ctx.db.select().from(flows).where(eq(flows.id, input.id));
            return result[0] || null;
        }),

    // Create a new flow
    create: publicProcedure
        .input(z.object({
            name: z.string(),
            description: z.string().optional(),
            definition: FlowDefinitionSchema,
        }))
        .mutation(async ({ ctx, input }) => {
            const id = `flow_${Date.now()}`;
            await ctx.db.insert(flows).values({
                id,
                name: input.name,
                description: input.description,
                definition: JSON.stringify(input.definition),
                status: 'draft',
            });
            return { id };
        }),

    // Update a flow
    update: publicProcedure
        .input(z.object({
            id: z.string(),
            name: z.string().optional(),
            description: z.string().optional(),
            definition: FlowDefinitionSchema.optional(),
        }))
        .mutation(async ({ ctx, input }) => {
            const updates: Record<string, unknown> = {
                updatedAt: new Date().toISOString(),
            };
            if (input.name) updates.name = input.name;
            if (input.description) updates.description = input.description;
            if (input.definition) updates.definition = JSON.stringify(input.definition);

            await ctx.db.update(flows).set(updates).where(eq(flows.id, input.id));
            return { success: true };
        }),

    // Publish a flow
    publish: publicProcedure
        .input(z.object({ id: z.string() }))
        .mutation(async ({ ctx, input }) => {
            await ctx.db.update(flows).set({
                status: 'published',
                publishedAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            }).where(eq(flows.id, input.id));
            return { success: true };
        }),

    // Delete a flow
    delete: publicProcedure
        .input(z.object({ id: z.string() }))
        .mutation(async ({ ctx, input }) => {
            await ctx.db.delete(flows).where(eq(flows.id, input.id));
            return { success: true };
        }),
});

// ============================================================================
// Sessions Router (Runtime)
// ============================================================================

const sessionsRouter = router({
    // Start a new session
    start: publicProcedure
        .input(z.object({ flowId: z.string() }))
        .mutation(async ({ ctx, input }) => {
            // Get flow definition
            const flowResult = await ctx.db.select().from(flows).where(eq(flows.id, input.flowId));
            const flow = flowResult[0];

            if (!flow) {
                throw new Error(`Flow ${input.flowId} not found`);
            }

            const definition = JSON.parse(flow.definition);
            const session = await ctx.engine.startSession(definition);

            return {
                sessionId: session.id,
                status: session.status,
                currentNodeId: session.currentNodeId,
                messages: [], // Would include initial messages
            };
        }),

    // Send input to a session
    input: publicProcedure
        .input(z.object({
            sessionId: z.string(),
            flowId: z.string(),
            message: z.string(),
        }))
        .mutation(async ({ ctx, input }) => {
            // Get flow definition
            const flowResult = await ctx.db.select().from(flows).where(eq(flows.id, input.flowId));
            const flow = flowResult[0];

            if (!flow) {
                throw new Error(`Flow ${input.flowId} not found`);
            }

            const definition = JSON.parse(flow.definition);
            const session = await ctx.engine.processInput(definition, input.sessionId, input.message);

            return {
                status: session.status,
                currentNodeId: session.currentNodeId,
                history: session.history,
            };
        }),

    // Get session state
    get: publicProcedure
        .input(z.object({ sessionId: z.string() }))
        .query(async ({ ctx, input }) => {
            return ctx.engine.getSession(input.sessionId);
        }),

    // End a session
    end: publicProcedure
        .input(z.object({ sessionId: z.string() }))
        .mutation(async ({ ctx, input }) => {
            await ctx.engine.endSession(input.sessionId);
            return { success: true };
        }),
});

// ============================================================================
// Knowledge Base Router
// ============================================================================

const knowledgeRouter = router({
    // List all knowledge bases
    list: publicProcedure.query(async ({ ctx }) => {
        return ctx.db.select().from(knowledgeBases).all();
    }),

    // Get a knowledge base
    get: publicProcedure
        .input(z.object({ id: z.string() }))
        .query(async ({ ctx, input }) => {
            const result = await ctx.db.select().from(knowledgeBases).where(eq(knowledgeBases.id, input.id));
            return result[0] || null;
        }),

    // Create a knowledge base
    create: publicProcedure
        .input(z.object({
            name: z.string(),
            description: z.string().optional(),
        }))
        .mutation(async ({ ctx, input }) => {
            const id = `kb_${Date.now()}`;
            await ctx.db.insert(knowledgeBases).values({
                id,
                name: input.name,
                description: input.description,
            });
            return { id };
        }),

    // Search a knowledge base
    search: publicProcedure
        .input(z.object({
            knowledgeBaseId: z.string(),
            query: z.string(),
            topK: z.number().optional(),
        }))
        .mutation(async ({ ctx, input }) => {
            // Would integrate with vector search
            return {
                results: [],
                answer: "Search result placeholder",
                confidence: 0.5,
            };
        }),
});

// ============================================================================
// Analytics Router
// ============================================================================

const analyticsRouter = router({
    // Get flow analytics
    getFlowAnalytics: publicProcedure
        .input(z.object({
            flowId: z.string(),
            startDate: z.string().optional(),
            endDate: z.string().optional(),
        }))
        .query(async ({ ctx, input }) => {
            const results = await ctx.db.select().from(analyticsDaily)
                .where(eq(analyticsDaily.flowId, input.flowId));

            // Aggregate metrics
            const totals = results.reduce(
                (acc, row) => ({
                    totalSessions: acc.totalSessions + row.totalSessions,
                    completedSessions: acc.completedSessions + row.completedSessions,
                    escalatedSessions: acc.escalatedSessions + row.escalatedSessions,
                    errorSessions: acc.errorSessions + row.errorSessions,
                    totalTurns: acc.totalTurns + row.totalTurns,
                    totalDuration: acc.totalDuration + row.totalDuration,
                    toolCalls: acc.toolCalls + row.toolCalls,
                    toolFailures: acc.toolFailures + row.toolFailures,
                }),
                {
                    totalSessions: 0,
                    completedSessions: 0,
                    escalatedSessions: 0,
                    errorSessions: 0,
                    totalTurns: 0,
                    totalDuration: 0,
                    toolCalls: 0,
                    toolFailures: 0,
                }
            );

            return {
                flowId: input.flowId,
                metrics: {
                    totalConversations: totals.totalSessions,
                    completionRate: totals.totalSessions > 0
                        ? totals.completedSessions / totals.totalSessions
                        : 0,
                    escalationRate: totals.totalSessions > 0
                        ? totals.escalatedSessions / totals.totalSessions
                        : 0,
                    errorRate: totals.totalSessions > 0
                        ? totals.errorSessions / totals.totalSessions
                        : 0,
                    avgTurns: totals.totalSessions > 0
                        ? totals.totalTurns / totals.totalSessions
                        : 0,
                    avgDuration: totals.totalSessions > 0
                        ? totals.totalDuration / totals.totalSessions
                        : 0,
                    toolFailureRate: totals.toolCalls > 0
                        ? totals.toolFailures / totals.toolCalls
                        : 0,
                },
                daily: results,
            };
        }),

    // Get overall dashboard stats
    getDashboardStats: publicProcedure.query(async ({ ctx }) => {
        const allFlows = await ctx.db.select().from(flows).all();
        const allAnalytics = await ctx.db.select().from(analyticsDaily).all();

        return {
            totalFlows: allFlows.length,
            publishedFlows: allFlows.filter(f => f.status === 'published').length,
            totalConversations: allAnalytics.reduce((sum, a) => sum + a.totalSessions, 0),
            avgCompletionRate: 0.78, // Mock for demo
        };
    }),
});

// ============================================================================
// Main Router
// ============================================================================

export const appRouter = router({
    flows: flowsRouter,
    sessions: sessionsRouter,
    knowledge: knowledgeRouter,
    analytics: analyticsRouter,
});

export type AppRouter = typeof appRouter;
