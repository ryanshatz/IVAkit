/**
 * IVAkit Type Definitions
 * 
 * Central type definitions for the entire IVAkit platform.
 */

// ============================================================================
// Flow Specification Types (v1.0)
// ============================================================================

/**
 * The complete flow definition - the core artifact of IVAkit
 */
export interface FlowDefinition {
    /** Schema version for forward compatibility */
    version: '1.0';

    /** Unique identifier for this flow */
    id: string;

    /** Human-readable name */
    name: string;

    /** Optional description */
    description?: string;

    /** The starting node ID */
    entryNode: string;

    /** All nodes in the flow */
    nodes: FlowNode[];

    /** Connections between nodes */
    edges: FlowEdge[];

    /** Variable definitions */
    variables: VariableDefinition[];

    /** Tool/integration definitions */
    tools: ToolDefinition[];

    /** Flow metadata */
    metadata: FlowMetadata;
}

/**
 * Metadata about the flow
 */
export interface FlowMetadata {
    createdAt: string;
    updatedAt: string;
    createdBy?: string;
    tags?: string[];
    channel?: 'chat' | 'voice' | 'both';
}

// ============================================================================
// Node Types
// ============================================================================

export type NodeType =
    | 'start'
    | 'message'
    | 'collect_input'
    | 'llm_router'
    | 'knowledge_search'
    | 'tool_call'
    | 'condition'
    | 'escalate'
    | 'end';

/**
 * Base node properties shared by all node types
 */
export interface BaseNode {
    id: string;
    type: NodeType;
    name: string;
    position: { x: number; y: number };
    description?: string;
}

/**
 * Start node - entry point of the flow
 */
export interface StartNode extends BaseNode {
    type: 'start';
    config: {
        /** Welcome message to send */
        welcomeMessage?: string;
        /** Variables to initialize */
        initVariables?: Record<string, unknown>;
    };
}

/**
 * Message node - sends a static or templated message
 */
export interface MessageNode extends BaseNode {
    type: 'message';
    config: {
        /** Message content (supports {{variable}} interpolation) */
        message: string;
        /** Optional delay before sending (ms) */
        delay?: number;
        /** Rich content attachments */
        attachments?: MessageAttachment[];
    };
}

export interface MessageAttachment {
    type: 'image' | 'button' | 'card' | 'list';
    content: Record<string, unknown>;
}

/**
 * Collect Input node - waits for user input with validation
 */
export interface CollectInputNode extends BaseNode {
    type: 'collect_input';
    config: {
        /** Prompt message to show */
        prompt: string;
        /** Variable to store the input */
        variableName: string;
        /** Validation rules */
        validation?: InputValidation;
        /** Retry configuration */
        retry?: {
            maxAttempts: number;
            retryMessage: string;
        };
        /** Timeout configuration */
        timeout?: {
            seconds: number;
            timeoutNodeId?: string;
        };
    };
}

export interface InputValidation {
    type: 'text' | 'number' | 'email' | 'phone' | 'date' | 'regex' | 'custom';
    pattern?: string;
    minLength?: number;
    maxLength?: number;
    min?: number;
    max?: number;
    customValidator?: string;
    errorMessage?: string;
}

/**
 * LLM Router node - uses AI for intent classification
 */
export interface LLMRouterNode extends BaseNode {
    type: 'llm_router';
    config: {
        /** System prompt for the LLM */
        systemPrompt: string;
        /** Available intents to classify */
        intents: IntentDefinition[];
        /** Model configuration */
        model?: ModelConfig;
        /** Fallback intent if classification fails */
        fallbackIntent?: string;
        /** Confidence threshold (0-1) */
        confidenceThreshold?: number;
    };
}

export interface IntentDefinition {
    name: string;
    description: string;
    examples?: string[];
    targetNodeId: string;
}

export interface ModelConfig {
    provider: 'ollama' | 'openai' | 'anthropic' | 'rules';
    model?: string;
    temperature?: number;
    maxTokens?: number;
}

/**
 * Knowledge Search node - RAG retrieval
 */
export interface KnowledgeSearchNode extends BaseNode {
    type: 'knowledge_search';
    config: {
        /** Knowledge base ID to search */
        knowledgeBaseId: string;
        /** Query (supports {{variable}} interpolation) */
        query: string;
        /** Number of results to return */
        topK?: number;
        /** Minimum similarity score (0-1) */
        minScore?: number;
        /** Variable to store results */
        resultVariable: string;
        /** Whether to only return grounded answers */
        groundedOnly?: boolean;
    };
}

/**
 * Tool Call node - external HTTP/webhook calls
 */
export interface ToolCallNode extends BaseNode {
    type: 'tool_call';
    config: {
        /** Tool ID to invoke */
        toolId: string;
        /** Input parameters (supports {{variable}} interpolation) */
        inputs: Record<string, unknown>;
        /** Variable to store the result */
        resultVariable: string;
        /** Timeout in seconds */
        timeout?: number;
        /** Retry configuration */
        retry?: {
            maxAttempts: number;
            backoffMs: number;
        };
        /** Error handling */
        onError?: {
            action: 'continue' | 'retry' | 'escalate' | 'goto';
            targetNodeId?: string;
        };
    };
}

/**
 * Condition node - if/else branching
 */
export interface ConditionNode extends BaseNode {
    type: 'condition';
    config: {
        /** Conditions to evaluate in order */
        conditions: ConditionRule[];
        /** Default branch if no conditions match */
        defaultNodeId?: string;
    };
}

export interface ConditionRule {
    /** Unique ID for this condition */
    id: string;
    /** Variable to evaluate */
    variable: string;
    /** Comparison operator */
    operator: ConditionOperator;
    /** Value to compare against */
    value: unknown;
    /** Target node if condition is true */
    targetNodeId: string;
}

export type ConditionOperator =
    | 'equals'
    | 'not_equals'
    | 'contains'
    | 'not_contains'
    | 'starts_with'
    | 'ends_with'
    | 'greater_than'
    | 'less_than'
    | 'greater_or_equal'
    | 'less_or_equal'
    | 'is_empty'
    | 'is_not_empty'
    | 'matches_regex';

/**
 * Escalate node - hand off to human agent
 */
export interface EscalateNode extends BaseNode {
    type: 'escalate';
    config: {
        /** Reason for escalation */
        reason: string;
        /** Queue/skill to route to */
        queue?: string;
        /** Priority level */
        priority?: 'low' | 'normal' | 'high' | 'urgent';
        /** Context to pass to agent */
        context?: Record<string, string>;
        /** Message to show user during handoff */
        handoffMessage?: string;
    };
}

/**
 * End node - terminates the flow
 */
export interface EndNode extends BaseNode {
    type: 'end';
    config: {
        /** Final message to send */
        message?: string;
        /** End status */
        status: 'completed' | 'escalated' | 'abandoned' | 'error';
        /** Summary data to log */
        summary?: Record<string, string>;
    };
}

/** Union type of all node types */
export type FlowNode =
    | StartNode
    | MessageNode
    | CollectInputNode
    | LLMRouterNode
    | KnowledgeSearchNode
    | ToolCallNode
    | ConditionNode
    | EscalateNode
    | EndNode;

// ============================================================================
// Edge Types
// ============================================================================

/**
 * Connection between two nodes
 */
export interface FlowEdge {
    id: string;
    source: string;
    target: string;
    sourceHandle?: string;
    targetHandle?: string;
    label?: string;
    condition?: string;
}

// ============================================================================
// Variable Types
// ============================================================================

export type VariableType =
    | 'string'
    | 'number'
    | 'boolean'
    | 'object'
    | 'array';

export interface VariableDefinition {
    name: string;
    type: VariableType;
    defaultValue?: unknown;
    description?: string;
    /** Whether this variable persists across sessions */
    persistent?: boolean;
}

// ============================================================================
// Tool Types
// ============================================================================

export interface ToolDefinition {
    id: string;
    name: string;
    description: string;
    type: 'http' | 'webhook' | 'function';
    config: ToolConfig;
    inputSchema: Record<string, ToolParameter>;
    outputSchema?: Record<string, ToolParameter>;
}

export interface ToolConfig {
    url?: string;
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
    headers?: Record<string, string>;
    auth?: {
        type: 'none' | 'basic' | 'bearer' | 'api_key';
        value?: string;
        headerName?: string;
    };
}

export interface ToolParameter {
    type: 'string' | 'number' | 'boolean' | 'object' | 'array';
    description?: string;
    required?: boolean;
    default?: unknown;
}

// ============================================================================
// Runtime Types
// ============================================================================

/**
 * Execution session state
 */
export interface SessionState {
    id: string;
    flowId: string;
    currentNodeId: string;
    variables: Record<string, unknown>;
    history: ExecutionStep[];
    status: SessionStatus;
    createdAt: string;
    updatedAt: string;
    metadata?: Record<string, unknown>;
}

export type SessionStatus =
    | 'active'
    | 'waiting_input'
    | 'completed'
    | 'escalated'
    | 'error'
    | 'timeout';

/**
 * Single execution step in the session history
 */
export interface ExecutionStep {
    stepId: string;
    nodeId: string;
    nodeType: NodeType;
    timestamp: string;
    input?: unknown;
    output?: unknown;
    duration?: number;
    error?: ExecutionError;
}

export interface ExecutionError {
    code: string;
    message: string;
    details?: Record<string, unknown>;
}

// ============================================================================
// Knowledge Base Types
// ============================================================================

export interface KnowledgeBase {
    id: string;
    name: string;
    description?: string;
    documents: DocumentInfo[];
    settings: KnowledgeBaseSettings;
    createdAt: string;
    updatedAt: string;
}

export interface DocumentInfo {
    id: string;
    name: string;
    type: 'txt' | 'md' | 'pdf' | 'html';
    size: number;
    chunks: number;
    uploadedAt: string;
}

export interface KnowledgeBaseSettings {
    chunkSize: number;
    chunkOverlap: number;
    embeddingModel: string;
}

export interface SearchResult {
    content: string;
    source: string;
    score: number;
    metadata?: Record<string, unknown>;
}

export interface KnowledgeSearchResponse {
    answer: string;
    sources: SearchResult[];
    confidence: number;
    grounded: boolean;
}

// ============================================================================
// Analytics Types
// ============================================================================

export interface FlowAnalytics {
    flowId: string;
    period: {
        start: string;
        end: string;
    };
    metrics: {
        totalConversations: number;
        completionRate: number;
        fallbackRate: number;
        escalationRate: number;
        avgTurns: number;
        avgDuration: number;
        toolFailureRate: number;
    };
    nodeMetrics: Record<string, NodeMetrics>;
}

export interface NodeMetrics {
    nodeId: string;
    executions: number;
    avgDuration: number;
    errorRate: number;
    exitPaths: Record<string, number>;
}

// ============================================================================
// API Types
// ============================================================================

export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: {
        code: string;
        message: string;
        details?: unknown;
    };
}

export interface PaginatedResponse<T> {
    items: T[];
    total: number;
    page: number;
    pageSize: number;
    hasMore: boolean;
}
