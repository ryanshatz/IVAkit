/**
 * Node Executor
 * 
 * Responsible for executing individual nodes based on their type.
 */

import type { ExecutionContext, NodeResult, NodeHandler, RuntimeServices } from './types';
import { createNodeHandlers } from './handlers';

export class NodeExecutor {
    private handlers: Record<string, NodeHandler>;

    constructor(services: RuntimeServices) {
        this.handlers = createNodeHandlers();
    }

    /**
     * Register a custom node handler
     */
    registerHandler(nodeType: string, handler: NodeHandler): void {
        this.handlers[nodeType] = handler;
    }

    /**
     * Execute a node
     */
    async execute(context: ExecutionContext): Promise<NodeResult> {
        const handler = this.handlers[context.node.type];

        if (!handler) {
            return {
                error: {
                    code: 'UNKNOWN_NODE_TYPE',
                    message: `No handler registered for node type: ${context.node.type}`,
                },
            };
        }

        try {
            return await handler(context);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            return {
                error: {
                    code: 'EXECUTION_ERROR',
                    message: errorMessage,
                    details: error,
                },
            };
        }
    }
}
