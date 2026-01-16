/**
 * IVAkit Database Schema
 * 
 * SQLite schema using Drizzle ORM for type-safe database access.
 */

import { sqliteTable, text, integer, real, blob } from 'drizzle-orm/sqlite-core';
import { relations } from 'drizzle-orm';

// ============================================================================
// Flows
// ============================================================================

export const flows = sqliteTable('flows', {
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    description: text('description'),
    definition: text('definition').notNull(), // JSON stringified FlowDefinition
    version: integer('version').notNull().default(1),
    status: text('status', { enum: ['draft', 'published', 'archived'] }).notNull().default('draft'),
    publishedAt: text('published_at'),
    createdAt: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
    updatedAt: text('updated_at').notNull().$defaultFn(() => new Date().toISOString()),
});

export const flowVersions = sqliteTable('flow_versions', {
    id: text('id').primaryKey(),
    flowId: text('flow_id').notNull().references(() => flows.id),
    version: integer('version').notNull(),
    definition: text('definition').notNull(),
    createdAt: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
    createdBy: text('created_by'),
    changeNote: text('change_note'),
});

// ============================================================================
// Sessions
// ============================================================================

export const sessions = sqliteTable('sessions', {
    id: text('id').primaryKey(),
    flowId: text('flow_id').notNull().references(() => flows.id),
    flowVersion: integer('flow_version').notNull(),
    currentNodeId: text('current_node_id').notNull(),
    variables: text('variables').notNull().$defaultFn(() => '{}'), // JSON
    status: text('status', {
        enum: ['active', 'waiting_input', 'completed', 'escalated', 'error', 'timeout']
    }).notNull().default('active'),
    channel: text('channel', { enum: ['chat', 'voice', 'simulator'] }).notNull().default('chat'),
    metadata: text('metadata'), // JSON
    createdAt: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
    updatedAt: text('updated_at').notNull().$defaultFn(() => new Date().toISOString()),
    completedAt: text('completed_at'),
});

export const sessionMessages = sqliteTable('session_messages', {
    id: text('id').primaryKey(),
    sessionId: text('session_id').notNull().references(() => sessions.id),
    role: text('role', { enum: ['user', 'assistant', 'system'] }).notNull(),
    content: text('content').notNull(),
    nodeId: text('node_id'),
    timestamp: text('timestamp').notNull().$defaultFn(() => new Date().toISOString()),
});

export const sessionSteps = sqliteTable('session_steps', {
    id: text('id').primaryKey(),
    sessionId: text('session_id').notNull().references(() => sessions.id),
    stepNumber: integer('step_number').notNull(),
    nodeId: text('node_id').notNull(),
    nodeType: text('node_type').notNull(),
    input: text('input'), // JSON
    output: text('output'), // JSON
    duration: integer('duration'), // milliseconds
    error: text('error'), // JSON
    timestamp: text('timestamp').notNull().$defaultFn(() => new Date().toISOString()),
});

// ============================================================================
// Knowledge Bases
// ============================================================================

export const knowledgeBases = sqliteTable('knowledge_bases', {
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    description: text('description'),
    settings: text('settings').notNull().$defaultFn(() => JSON.stringify({
        chunkSize: 500,
        chunkOverlap: 50,
        embeddingModel: 'all-minilm',
    })),
    createdAt: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
    updatedAt: text('updated_at').notNull().$defaultFn(() => new Date().toISOString()),
});

export const documents = sqliteTable('documents', {
    id: text('id').primaryKey(),
    knowledgeBaseId: text('knowledge_base_id').notNull().references(() => knowledgeBases.id),
    name: text('name').notNull(),
    type: text('type', { enum: ['txt', 'md', 'pdf', 'html'] }).notNull(),
    content: text('content').notNull(),
    size: integer('size').notNull(),
    uploadedAt: text('uploaded_at').notNull().$defaultFn(() => new Date().toISOString()),
});

export const documentChunks = sqliteTable('document_chunks', {
    id: text('id').primaryKey(),
    documentId: text('document_id').notNull().references(() => documents.id),
    knowledgeBaseId: text('knowledge_base_id').notNull().references(() => knowledgeBases.id),
    content: text('content').notNull(),
    embedding: blob('embedding'), // Float32Array serialized
    startIndex: integer('start_index').notNull(),
    endIndex: integer('end_index').notNull(),
    metadata: text('metadata'), // JSON
});

// ============================================================================
// Tools
// ============================================================================

export const tools = sqliteTable('tools', {
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    description: text('description').notNull(),
    type: text('type', { enum: ['http', 'webhook', 'function'] }).notNull(),
    config: text('config').notNull(), // JSON
    inputSchema: text('input_schema').notNull(), // JSON
    outputSchema: text('output_schema'), // JSON
    createdAt: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
    updatedAt: text('updated_at').notNull().$defaultFn(() => new Date().toISOString()),
});

// ============================================================================
// Analytics
// ============================================================================

export const analyticsDaily = sqliteTable('analytics_daily', {
    id: text('id').primaryKey(),
    flowId: text('flow_id').notNull().references(() => flows.id),
    date: text('date').notNull(), // YYYY-MM-DD
    totalSessions: integer('total_sessions').notNull().default(0),
    completedSessions: integer('completed_sessions').notNull().default(0),
    escalatedSessions: integer('escalated_sessions').notNull().default(0),
    errorSessions: integer('error_sessions').notNull().default(0),
    totalTurns: integer('total_turns').notNull().default(0),
    totalDuration: integer('total_duration').notNull().default(0), // milliseconds
    toolCalls: integer('tool_calls').notNull().default(0),
    toolFailures: integer('tool_failures').notNull().default(0),
});

export const nodeAnalytics = sqliteTable('node_analytics', {
    id: text('id').primaryKey(),
    flowId: text('flow_id').notNull().references(() => flows.id),
    nodeId: text('node_id').notNull(),
    date: text('date').notNull(), // YYYY-MM-DD
    executions: integer('executions').notNull().default(0),
    totalDuration: integer('total_duration').notNull().default(0),
    errors: integer('errors').notNull().default(0),
    exitPaths: text('exit_paths'), // JSON { edgeId: count }
});

// ============================================================================
// Relations
// ============================================================================

export const flowsRelations = relations(flows, ({ many }) => ({
    versions: many(flowVersions),
    sessions: many(sessions),
    analytics: many(analyticsDaily),
}));

export const flowVersionsRelations = relations(flowVersions, ({ one }) => ({
    flow: one(flows, {
        fields: [flowVersions.flowId],
        references: [flows.id],
    }),
}));

export const sessionsRelations = relations(sessions, ({ one, many }) => ({
    flow: one(flows, {
        fields: [sessions.flowId],
        references: [flows.id],
    }),
    messages: many(sessionMessages),
    steps: many(sessionSteps),
}));

export const sessionMessagesRelations = relations(sessionMessages, ({ one }) => ({
    session: one(sessions, {
        fields: [sessionMessages.sessionId],
        references: [sessions.id],
    }),
}));

export const sessionStepsRelations = relations(sessionSteps, ({ one }) => ({
    session: one(sessions, {
        fields: [sessionSteps.sessionId],
        references: [sessions.id],
    }),
}));

export const knowledgeBasesRelations = relations(knowledgeBases, ({ many }) => ({
    documents: many(documents),
    chunks: many(documentChunks),
}));

export const documentsRelations = relations(documents, ({ one, many }) => ({
    knowledgeBase: one(knowledgeBases, {
        fields: [documents.knowledgeBaseId],
        references: [knowledgeBases.id],
    }),
    chunks: many(documentChunks),
}));

export const documentChunksRelations = relations(documentChunks, ({ one }) => ({
    document: one(documents, {
        fields: [documentChunks.documentId],
        references: [documents.id],
    }),
    knowledgeBase: one(knowledgeBases, {
        fields: [documentChunks.knowledgeBaseId],
        references: [knowledgeBases.id],
    }),
}));
