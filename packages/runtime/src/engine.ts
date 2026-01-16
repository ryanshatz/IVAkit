/**
 * IVAkit Flow Engine
 * 
 * The main execution engine for IVA flows.
 */

import type { FlowDefinition, SessionState, ExecutionStep } from '@ivakit/shared';
import { generateId, findNode, getNextNodes, cloneSession } from '@ivakit/shared';
import type {
    EngineConfig,
    RuntimeServices,
    RuntimeEvent,
    EventHandler,
    NodeResult
} from './types';
import { NodeExecutor } from './executor';

const DEFAULT_MAX_STEPS = 100;

export class FlowEngine {
    private config: Required<EngineConfig>;
    private services: RuntimeServices;
    private executor: NodeExecutor;
    private eventHandlers: EventHandler[] = [];

    constructor(services: RuntimeServices, config: EngineConfig = {}) {
        this.services = services;
        this.config = {
            maxSteps: config.maxSteps ?? DEFAULT_MAX_STEPS,
            defaultToolTimeout: config.defaultToolTimeout ?? 30000,
            debug: config.debug ?? false,
        };
        this.executor = new NodeExecutor(services);
    }

    /**
     * Subscribe to runtime events
     */
    on(handler: EventHandler): () => void {
        this.eventHandlers.push(handler);
        return () => {
            this.eventHandlers = this.eventHandlers.filter(h => h !== handler);
        };
    }

    private emit(event: RuntimeEvent): void {
        for (const handler of this.eventHandlers) {
            try {
                handler(event);
            } catch (e) {
                console.error('Event handler error:', e);
            }
        }
    }

    private log(level: 'debug' | 'info' | 'warn' | 'error', message: string, data?: unknown): void {
        if (level === 'debug' && !this.config.debug) return;
        const logFn = level === 'error' ? console.error : level === 'warn' ? console.warn : console.log;
        logFn(`[IVAkit:${level}] ${message}`, data ?? '');
    }

    /**
     * Start a new session for a flow
     */
    async startSession(flow: FlowDefinition): Promise<SessionState> {
        const now = new Date().toISOString();

        // Find the start node
        const startNode = findNode(flow, flow.entryNode);
        if (!startNode) {
            throw new Error(`Entry node "${flow.entryNode}" not found in flow`);
        }

        // Create initial session state
        const session: SessionState = {
            id: generateId('session'),
            flowId: flow.id,
            currentNodeId: flow.entryNode,
            variables: this.initializeVariables(flow),
            history: [],
            status: 'active',
            createdAt: now,
            updatedAt: now,
        };

        // Store session
        await this.services.sessions.set(session);

        this.emit({ type: 'session_started', sessionId: session.id, flowId: flow.id });
        this.log('info', `Session started: ${session.id}`);

        // Execute until we need input or reach an end
        return this.executeFlow(flow, session);
    }

    /**
     * Process user input for an existing session
     */
    async processInput(
        flow: FlowDefinition,
        sessionId: string,
        input: string
    ): Promise<SessionState> {
        // Get session
        const session = await this.services.sessions.get(sessionId);
        if (!session) {
            throw new Error(`Session "${sessionId}" not found`);
        }

        if (session.status !== 'waiting_input') {
            throw new Error(`Session "${sessionId}" is not waiting for input (status: ${session.status})`);
        }

        this.emit({ type: 'input_received', sessionId, input });

        // Clone session for immutable updates
        const updatedSession = cloneSession(session);
        updatedSession.status = 'active';
        updatedSession.updatedAt = new Date().toISOString();

        // Execute with input
        return this.executeFlow(flow, updatedSession, input);
    }

    /**
     * Initialize flow variables with defaults
     */
    private initializeVariables(flow: FlowDefinition): Record<string, unknown> {
        const variables: Record<string, unknown> = {};

        for (const varDef of flow.variables) {
            if (varDef.defaultValue !== undefined) {
                variables[varDef.name] = varDef.defaultValue;
            }
        }

        // Add start node init variables
        const startNode = findNode(flow, flow.entryNode);
        if (startNode?.type === 'start' && startNode.config.initVariables) {
            Object.assign(variables, startNode.config.initVariables);
        }

        return variables;
    }

    /**
     * Execute the flow from current position
     */
    private async executeFlow(
        flow: FlowDefinition,
        session: SessionState,
        input?: string
    ): Promise<SessionState> {
        let currentSession = cloneSession(session);
        let steps = 0;

        while (steps < this.config.maxSteps) {
            steps++;

            // Get current node
            const node = findNode(flow, currentSession.currentNodeId);
            if (!node) {
                currentSession.status = 'error';
                this.log('error', `Node "${currentSession.currentNodeId}" not found`);
                break;
            }

            this.emit({
                type: 'node_started',
                sessionId: currentSession.id,
                nodeId: node.id,
                nodeType: node.type
            });

            const startTime = Date.now();

            // Execute node
            const result = await this.executor.execute({
                flow,
                session: currentSession,
                node,
                input,
                services: this.services,
                emit: this.emit.bind(this),
                log: this.log.bind(this),
            });

            const duration = Date.now() - startTime;

            // Record execution step
            const step: ExecutionStep = {
                stepId: generateId('step'),
                nodeId: node.id,
                nodeType: node.type,
                timestamp: new Date().toISOString(),
                input,
                output: result.output,
                duration,
                error: result.error,
            };
            currentSession.history.push(step);

            this.emit({
                type: 'node_completed',
                sessionId: currentSession.id,
                nodeId: node.id,
                duration,
                output: result.output
            });

            // Update variables
            if (result.variables) {
                Object.assign(currentSession.variables, result.variables);
            }

            // Send message if any
            if (result.message) {
                this.emit({
                    type: 'message_sent',
                    sessionId: currentSession.id,
                    message: result.message
                });
            }

            // Handle errors
            if (result.error) {
                this.emit({
                    type: 'node_error',
                    sessionId: currentSession.id,
                    nodeId: node.id,
                    error: result.error
                });
                currentSession.status = 'error';
                break;
            }

            // Check if we need to wait for input
            if (result.waitForInput) {
                currentSession.status = 'waiting_input';
                break;
            }

            // Check if flow ended
            if (result.end) {
                currentSession.status = 'completed';
                this.emit({
                    type: 'session_completed',
                    sessionId: currentSession.id,
                    status: 'completed'
                });
                break;
            }

            // Determine next node
            let nextNodeId = result.nextNodeId;

            if (nextNodeId === undefined) {
                // Follow default edge
                const nextNodes = getNextNodes(flow, node.id);
                if (nextNodes.length === 0) {
                    currentSession.status = 'completed';
                    break;
                }
                nextNodeId = nextNodes[0].id;
            }

            if (nextNodeId === null) {
                // Wait for input
                currentSession.status = 'waiting_input';
                break;
            }

            currentSession.currentNodeId = nextNodeId;
            input = undefined; // Clear input after first use

            currentSession.updatedAt = new Date().toISOString();
        }

        if (steps >= this.config.maxSteps) {
            this.log('error', `Maximum steps (${this.config.maxSteps}) exceeded`);
            currentSession.status = 'error';
        }

        // Persist session
        await this.services.sessions.set(currentSession);

        return currentSession;
    }

    /**
     * Get session state
     */
    async getSession(sessionId: string): Promise<SessionState | null> {
        return this.services.sessions.get(sessionId);
    }

    /**
     * End a session
     */
    async endSession(sessionId: string): Promise<void> {
        await this.services.sessions.delete(sessionId);
        this.log('info', `Session ended: ${sessionId}`);
    }
}
