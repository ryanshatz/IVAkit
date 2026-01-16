/**
 * IVAkit Zod Schemas
 * 
 * Runtime validation schemas for all IVAkit data structures.
 * These schemas enforce the Flow Specification at runtime.
 */

import { z } from 'zod';

// ============================================================================
// Base Schemas
// ============================================================================

export const PositionSchema = z.object({
    x: z.number(),
    y: z.number(),
});

export const NodeTypeSchema = z.enum([
    'start',
    'message',
    'collect_input',
    'llm_router',
    'knowledge_search',
    'tool_call',
    'condition',
    'escalate',
    'end',
]);

// ============================================================================
// Node Config Schemas
// ============================================================================

export const MessageAttachmentSchema = z.object({
    type: z.enum(['image', 'button', 'card', 'list']),
    content: z.record(z.unknown()),
});

export const InputValidationSchema = z.object({
    type: z.enum(['text', 'number', 'email', 'phone', 'date', 'regex', 'custom']),
    pattern: z.string().optional(),
    minLength: z.number().optional(),
    maxLength: z.number().optional(),
    min: z.number().optional(),
    max: z.number().optional(),
    customValidator: z.string().optional(),
    errorMessage: z.string().optional(),
});

export const ModelConfigSchema = z.object({
    provider: z.enum(['ollama', 'openai', 'anthropic', 'rules']),
    model: z.string().optional(),
    temperature: z.number().min(0).max(2).optional(),
    maxTokens: z.number().positive().optional(),
});

export const IntentDefinitionSchema = z.object({
    name: z.string().min(1),
    description: z.string(),
    examples: z.array(z.string()).optional(),
    targetNodeId: z.string(),
});

export const ConditionOperatorSchema = z.enum([
    'equals',
    'not_equals',
    'contains',
    'not_contains',
    'starts_with',
    'ends_with',
    'greater_than',
    'less_than',
    'greater_or_equal',
    'less_or_equal',
    'is_empty',
    'is_not_empty',
    'matches_regex',
]);

export const ConditionRuleSchema = z.object({
    id: z.string(),
    variable: z.string(),
    operator: ConditionOperatorSchema,
    value: z.unknown(),
    targetNodeId: z.string(),
});

// ============================================================================
// Node Schemas
// ============================================================================

const BaseNodeSchema = z.object({
    id: z.string().min(1),
    name: z.string().min(1),
    position: PositionSchema,
    description: z.string().optional(),
});

export const StartNodeSchema = BaseNodeSchema.extend({
    type: z.literal('start'),
    config: z.object({
        welcomeMessage: z.string().optional(),
        initVariables: z.record(z.unknown()).optional(),
    }),
});

export const MessageNodeSchema = BaseNodeSchema.extend({
    type: z.literal('message'),
    config: z.object({
        message: z.string().min(1),
        delay: z.number().nonnegative().optional(),
        attachments: z.array(MessageAttachmentSchema).optional(),
    }),
});

export const CollectInputNodeSchema = BaseNodeSchema.extend({
    type: z.literal('collect_input'),
    config: z.object({
        prompt: z.string().min(1),
        variableName: z.string().min(1),
        validation: InputValidationSchema.optional(),
        retry: z.object({
            maxAttempts: z.number().int().positive(),
            retryMessage: z.string(),
        }).optional(),
        timeout: z.object({
            seconds: z.number().positive(),
            timeoutNodeId: z.string().optional(),
        }).optional(),
    }),
});

export const LLMRouterNodeSchema = BaseNodeSchema.extend({
    type: z.literal('llm_router'),
    config: z.object({
        systemPrompt: z.string().min(1),
        intents: z.array(IntentDefinitionSchema).min(1),
        model: ModelConfigSchema.optional(),
        fallbackIntent: z.string().optional(),
        confidenceThreshold: z.number().min(0).max(1).optional(),
    }),
});

export const KnowledgeSearchNodeSchema = BaseNodeSchema.extend({
    type: z.literal('knowledge_search'),
    config: z.object({
        knowledgeBaseId: z.string().min(1),
        query: z.string().min(1),
        topK: z.number().int().positive().optional(),
        minScore: z.number().min(0).max(1).optional(),
        resultVariable: z.string().min(1),
        groundedOnly: z.boolean().optional(),
    }),
});

export const ToolCallNodeSchema = BaseNodeSchema.extend({
    type: z.literal('tool_call'),
    config: z.object({
        toolId: z.string().min(1),
        inputs: z.record(z.unknown()),
        resultVariable: z.string().min(1),
        timeout: z.number().positive().optional(),
        retry: z.object({
            maxAttempts: z.number().int().positive(),
            backoffMs: z.number().nonnegative(),
        }).optional(),
        onError: z.object({
            action: z.enum(['continue', 'retry', 'escalate', 'goto']),
            targetNodeId: z.string().optional(),
        }).optional(),
    }),
});

export const ConditionNodeSchema = BaseNodeSchema.extend({
    type: z.literal('condition'),
    config: z.object({
        conditions: z.array(ConditionRuleSchema).min(1),
        defaultNodeId: z.string().optional(),
    }),
});

export const EscalateNodeSchema = BaseNodeSchema.extend({
    type: z.literal('escalate'),
    config: z.object({
        reason: z.string().min(1),
        queue: z.string().optional(),
        priority: z.enum(['low', 'normal', 'high', 'urgent']).optional(),
        context: z.record(z.string()).optional(),
        handoffMessage: z.string().optional(),
    }),
});

export const EndNodeSchema = BaseNodeSchema.extend({
    type: z.literal('end'),
    config: z.object({
        message: z.string().optional(),
        status: z.enum(['completed', 'escalated', 'abandoned', 'error']),
        summary: z.record(z.string()).optional(),
    }),
});

export const FlowNodeSchema = z.discriminatedUnion('type', [
    StartNodeSchema,
    MessageNodeSchema,
    CollectInputNodeSchema,
    LLMRouterNodeSchema,
    KnowledgeSearchNodeSchema,
    ToolCallNodeSchema,
    ConditionNodeSchema,
    EscalateNodeSchema,
    EndNodeSchema,
]);

// ============================================================================
// Edge Schema
// ============================================================================

export const FlowEdgeSchema = z.object({
    id: z.string().min(1),
    source: z.string().min(1),
    target: z.string().min(1),
    sourceHandle: z.string().optional(),
    targetHandle: z.string().optional(),
    label: z.string().optional(),
    condition: z.string().optional(),
});

// ============================================================================
// Variable Schema
// ============================================================================

export const VariableTypeSchema = z.enum([
    'string',
    'number',
    'boolean',
    'object',
    'array',
]);

export const VariableDefinitionSchema = z.object({
    name: z.string().min(1),
    type: VariableTypeSchema,
    defaultValue: z.unknown().optional(),
    description: z.string().optional(),
    persistent: z.boolean().optional(),
});

// ============================================================================
// Tool Schema
// ============================================================================

export const ToolParameterSchema = z.object({
    type: z.enum(['string', 'number', 'boolean', 'object', 'array']),
    description: z.string().optional(),
    required: z.boolean().optional(),
    default: z.unknown().optional(),
});

export const ToolConfigSchema = z.object({
    url: z.string().url().optional(),
    method: z.enum(['GET', 'POST', 'PUT', 'DELETE', 'PATCH']).optional(),
    headers: z.record(z.string()).optional(),
    auth: z.object({
        type: z.enum(['none', 'basic', 'bearer', 'api_key']),
        value: z.string().optional(),
        headerName: z.string().optional(),
    }).optional(),
});

export const ToolDefinitionSchema = z.object({
    id: z.string().min(1),
    name: z.string().min(1),
    description: z.string(),
    type: z.enum(['http', 'webhook', 'function']),
    config: ToolConfigSchema,
    inputSchema: z.record(ToolParameterSchema),
    outputSchema: z.record(ToolParameterSchema).optional(),
});

// ============================================================================
// Flow Metadata Schema
// ============================================================================

export const FlowMetadataSchema = z.object({
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
    createdBy: z.string().optional(),
    tags: z.array(z.string()).optional(),
    channel: z.enum(['chat', 'voice', 'both']).optional(),
});

// ============================================================================
// Complete Flow Definition Schema
// ============================================================================

export const FlowDefinitionSchema = z.object({
    version: z.literal('1.0'),
    id: z.string().min(1),
    name: z.string().min(1),
    description: z.string().optional(),
    entryNode: z.string().min(1),
    nodes: z.array(FlowNodeSchema).min(1),
    edges: z.array(FlowEdgeSchema),
    variables: z.array(VariableDefinitionSchema),
    tools: z.array(ToolDefinitionSchema),
    metadata: FlowMetadataSchema,
});

// ============================================================================
// Runtime Schemas
// ============================================================================

export const SessionStatusSchema = z.enum([
    'active',
    'waiting_input',
    'completed',
    'escalated',
    'error',
    'timeout',
]);

export const ExecutionErrorSchema = z.object({
    code: z.string(),
    message: z.string(),
    details: z.record(z.unknown()).optional(),
});

export const ExecutionStepSchema = z.object({
    stepId: z.string(),
    nodeId: z.string(),
    nodeType: NodeTypeSchema,
    timestamp: z.string().datetime(),
    input: z.unknown().optional(),
    output: z.unknown().optional(),
    duration: z.number().optional(),
    error: ExecutionErrorSchema.optional(),
});

export const SessionStateSchema = z.object({
    id: z.string(),
    flowId: z.string(),
    currentNodeId: z.string(),
    variables: z.record(z.unknown()),
    history: z.array(ExecutionStepSchema),
    status: SessionStatusSchema,
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
    metadata: z.record(z.unknown()).optional(),
});

// ============================================================================
// Knowledge Base Schemas
// ============================================================================

export const DocumentInfoSchema = z.object({
    id: z.string(),
    name: z.string(),
    type: z.enum(['txt', 'md', 'pdf', 'html']),
    size: z.number(),
    chunks: z.number(),
    uploadedAt: z.string().datetime(),
});

export const KnowledgeBaseSettingsSchema = z.object({
    chunkSize: z.number().int().positive(),
    chunkOverlap: z.number().int().nonnegative(),
    embeddingModel: z.string(),
});

export const KnowledgeBaseSchema = z.object({
    id: z.string(),
    name: z.string(),
    description: z.string().optional(),
    documents: z.array(DocumentInfoSchema),
    settings: KnowledgeBaseSettingsSchema,
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
});

export const SearchResultSchema = z.object({
    content: z.string(),
    source: z.string(),
    score: z.number(),
    metadata: z.record(z.unknown()).optional(),
});

export const KnowledgeSearchResponseSchema = z.object({
    answer: z.string(),
    sources: z.array(SearchResultSchema),
    confidence: z.number(),
    grounded: z.boolean(),
});

// ============================================================================
// API Schemas
// ============================================================================

export const ApiErrorSchema = z.object({
    code: z.string(),
    message: z.string(),
    details: z.unknown().optional(),
});

export const ApiResponseSchema = <T extends z.ZodType>(dataSchema: T) =>
    z.object({
        success: z.boolean(),
        data: dataSchema.optional(),
        error: ApiErrorSchema.optional(),
    });

export const PaginationSchema = z.object({
    page: z.number().int().positive().default(1),
    pageSize: z.number().int().positive().max(100).default(20),
});

// ============================================================================
// Type Inference Helpers
// ============================================================================

export type FlowDefinitionInput = z.input<typeof FlowDefinitionSchema>;
export type FlowDefinitionOutput = z.output<typeof FlowDefinitionSchema>;
export type FlowNodeInput = z.input<typeof FlowNodeSchema>;
export type SessionStateInput = z.input<typeof SessionStateSchema>;
