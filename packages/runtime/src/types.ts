/**
 * Runtime Types
 */

import type {
    FlowDefinition,
    FlowNode,
    SessionState,
    ExecutionStep,
    NodeType
} from '@ivakit/shared';

/**
 * Context passed to node handlers during execution
 */
export interface ExecutionContext {
    /** The flow being executed */
    flow: FlowDefinition;

    /** Current session state */
    session: SessionState;

    /** The current node being executed */
    node: FlowNode;

    /** User input (if any) */
    input?: string;

    /** Services available to handlers */
    services: RuntimeServices;

    /** Emit an event */
    emit: (event: RuntimeEvent) => void;

    /** Log a message */
    log: (level: 'debug' | 'info' | 'warn' | 'error', message: string, data?: unknown) => void;
}

/**
 * Result from a node handler
 */
export interface NodeResult {
    /** Output data from the node */
    output?: unknown;

    /** Message to send to the user (if any) */
    message?: string;

    /** Next node ID to execute (null = wait for input, undefined = follow edge) */
    nextNodeId?: string | null;

    /** Variables to update */
    variables?: Record<string, unknown>;

    /** Whether execution should wait for user input */
    waitForInput?: boolean;

    /** Whether execution should end */
    end?: boolean;

    /** Error if node execution failed */
    error?: {
        code: string;
        message: string;
        details?: unknown;
    };
}

/**
 * Node handler function signature
 */
export type NodeHandler = (context: ExecutionContext) => Promise<NodeResult>;

/**
 * Registry of node handlers
 */
export type NodeHandlerRegistry = Record<NodeType, NodeHandler>;

/**
 * Runtime services available to handlers
 */
export interface RuntimeServices {
    /** AI/LLM service */
    ai: AIService;

    /** Knowledge base service */
    knowledge: KnowledgeService;

    /** Tool/HTTP service */
    tools: ToolService;

    /** Session storage */
    sessions: SessionStorage;
}

/**
 * AI Service interface
 */
export interface AIService {
    classify(options: {
        systemPrompt: string;
        userMessage: string;
        intents: Array<{ name: string; description: string }>;
        model?: { provider: string; model?: string; temperature?: number };
    }): Promise<{
        intent: string;
        confidence: number;
        reasoning?: string;
    }>;

    generate(options: {
        systemPrompt: string;
        userMessage: string;
        model?: { provider: string; model?: string; temperature?: number };
        schema?: Record<string, unknown>;
    }): Promise<{
        response: string;
        structured?: unknown;
        tokens: { input: number; output: number };
    }>;
}

/**
 * Knowledge Base Service interface
 */
export interface KnowledgeService {
    search(options: {
        knowledgeBaseId: string;
        query: string;
        topK?: number;
        minScore?: number;
    }): Promise<{
        results: Array<{ content: string; source: string; score: number }>;
        answer?: string;
        confidence: number;
        grounded: boolean;
    }>;
}

/**
 * Tool Service interface
 */
export interface ToolService {
    execute(options: {
        toolId: string;
        inputs: Record<string, unknown>;
        timeout?: number;
    }): Promise<{
        success: boolean;
        output?: unknown;
        error?: string;
    }>;
}

/**
 * Session Storage interface
 */
export interface SessionStorage {
    get(sessionId: string): Promise<SessionState | null>;
    set(session: SessionState): Promise<void>;
    delete(sessionId: string): Promise<void>;
}

/**
 * Runtime events for observability
 */
export type RuntimeEvent =
    | { type: 'session_started'; sessionId: string; flowId: string }
    | { type: 'node_started'; sessionId: string; nodeId: string; nodeType: string }
    | { type: 'node_completed'; sessionId: string; nodeId: string; duration: number; output?: unknown }
    | { type: 'node_error'; sessionId: string; nodeId: string; error: unknown }
    | { type: 'message_sent'; sessionId: string; message: string }
    | { type: 'input_received'; sessionId: string; input: string }
    | { type: 'session_completed'; sessionId: string; status: string }
    | { type: 'session_escalated'; sessionId: string; reason: string };

/**
 * Event handler
 */
export type EventHandler = (event: RuntimeEvent) => void;

/**
 * Engine configuration
 */
export interface EngineConfig {
    /** Maximum steps per execution (prevents infinite loops) */
    maxSteps?: number;

    /** Default timeout for tool calls (ms) */
    defaultToolTimeout?: number;

    /** Whether to enable debug logging */
    debug?: boolean;
}
