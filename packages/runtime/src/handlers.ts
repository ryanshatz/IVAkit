/**
 * Node Handlers
 * 
 * Implementation of handlers for each node type.
 * These are the core execution logic for the runtime.
 */

import type {
    StartNode,
    MessageNode,
    CollectInputNode,
    LLMRouterNode,
    KnowledgeSearchNode,
    ToolCallNode,
    ConditionNode,
    EscalateNode,
    EndNode
} from '@ivakit/shared';
import { interpolate, evaluateCondition, findConnectedEdges } from '@ivakit/shared';
import type { ExecutionContext, NodeResult, NodeHandler } from './types';

/**
 * Create all node handlers
 */
export function createNodeHandlers(): Record<string, NodeHandler> {
    return {
        start: handleStart,
        message: handleMessage,
        collect_input: handleCollectInput,
        llm_router: handleLLMRouter,
        knowledge_search: handleKnowledgeSearch,
        tool_call: handleToolCall,
        condition: handleCondition,
        escalate: handleEscalate,
        end: handleEnd,
    };
}

/**
 * Start Node Handler
 */
async function handleStart(context: ExecutionContext): Promise<NodeResult> {
    const node = context.node as StartNode;
    const { config } = node;

    let message: string | undefined;
    if (config.welcomeMessage) {
        message = interpolate(config.welcomeMessage, context.session.variables);
    }

    return {
        message,
        output: { started: true },
    };
}

/**
 * Message Node Handler
 */
async function handleMessage(context: ExecutionContext): Promise<NodeResult> {
    const node = context.node as MessageNode;
    const { config } = node;

    const message = interpolate(config.message, context.session.variables);

    // Handle delay if specified
    if (config.delay && config.delay > 0) {
        await new Promise(resolve => setTimeout(resolve, config.delay));
    }

    return {
        message,
        output: { message },
    };
}

/**
 * Collect Input Node Handler
 */
async function handleCollectInput(context: ExecutionContext): Promise<NodeResult> {
    const node = context.node as CollectInputNode;
    const { config } = node;

    // If we have input, validate and store it
    if (context.input !== undefined) {
        const input = context.input;

        // Validate input if validation rules exist
        if (config.validation) {
            const isValid = validateInput(input, config.validation);
            if (!isValid) {
                // If retry is configured, send retry message and wait for input again
                if (config.retry) {
                    const attempts = (context.session.variables[`${config.variableName}_attempts`] as number) || 0;

                    if (attempts >= config.retry.maxAttempts) {
                        return {
                            error: {
                                code: 'MAX_RETRIES_EXCEEDED',
                                message: `Maximum retry attempts (${config.retry.maxAttempts}) exceeded`,
                            },
                        };
                    }

                    return {
                        message: config.retry.retryMessage,
                        variables: { [`${config.variableName}_attempts`]: attempts + 1 },
                        waitForInput: true,
                        nextNodeId: null,
                    };
                }

                return {
                    message: config.validation.errorMessage || 'Invalid input. Please try again.',
                    waitForInput: true,
                    nextNodeId: null,
                };
            }
        }

        // Store the valid input
        return {
            variables: {
                [config.variableName]: input,
                [`${config.variableName}_attempts`]: 0,
            },
            output: { collected: input },
        };
    }

    // No input yet - send prompt and wait
    let message: string | undefined;
    if (config.prompt) {
        message = interpolate(config.prompt, context.session.variables);
    }

    return {
        message,
        waitForInput: true,
        nextNodeId: null,
    };
}

/**
 * Validate input based on validation rules
 */
function validateInput(input: string, validation: CollectInputNode['config']['validation']): boolean {
    if (!validation) return true;

    switch (validation.type) {
        case 'text':
            if (validation.minLength && input.length < validation.minLength) return false;
            if (validation.maxLength && input.length > validation.maxLength) return false;
            return true;

        case 'number':
            const num = Number(input);
            if (isNaN(num)) return false;
            if (validation.min !== undefined && num < validation.min) return false;
            if (validation.max !== undefined && num > validation.max) return false;
            return true;

        case 'email':
            return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input);

        case 'phone':
            return /^[\d\s\-+()]{10,}$/.test(input);

        case 'regex':
            if (!validation.pattern) return true;
            try {
                return new RegExp(validation.pattern).test(input);
            } catch {
                return false;
            }

        default:
            return true;
    }
}

/**
 * LLM Router Node Handler
 */
async function handleLLMRouter(context: ExecutionContext): Promise<NodeResult> {
    const node = context.node as LLMRouterNode;
    const { config } = node;

    // Get the user message to classify
    const userMessage = context.input ||
        (context.session.variables['user_message'] as string) ||
        (context.session.variables['customer_message'] as string) ||
        '';

    try {
        // Call AI service to classify intent
        const result = await context.services.ai.classify({
            systemPrompt: config.systemPrompt,
            userMessage,
            intents: config.intents.map(i => ({ name: i.name, description: i.description })),
            model: config.model,
        });

        context.log('info', `LLM Router classified intent: ${result.intent} (${(result.confidence * 100).toFixed(1)}%)`);

        // Check confidence threshold
        const threshold = config.confidenceThreshold ?? 0.5;
        if (result.confidence < threshold && config.fallbackIntent) {
            const fallbackIntentDef = config.intents.find(i => i.name === config.fallbackIntent);
            return {
                output: {
                    intent: config.fallbackIntent,
                    confidence: result.confidence,
                    originalIntent: result.intent,
                    fellback: true
                },
                variables: {
                    last_intent: config.fallbackIntent,
                    last_confidence: result.confidence,
                },
                nextNodeId: fallbackIntentDef?.targetNodeId,
            };
        }

        // Find the matched intent
        const matchedIntent = config.intents.find(i => i.name === result.intent);
        if (!matchedIntent) {
            // Use fallback if no match
            if (config.fallbackIntent) {
                const fallbackIntentDef = config.intents.find(i => i.name === config.fallbackIntent);
                return {
                    output: { intent: config.fallbackIntent, confidence: 0, fellback: true },
                    variables: { last_intent: config.fallbackIntent, last_confidence: 0 },
                    nextNodeId: fallbackIntentDef?.targetNodeId,
                };
            }

            return {
                error: {
                    code: 'INTENT_NOT_FOUND',
                    message: `Intent "${result.intent}" not found in configured intents`,
                },
            };
        }

        return {
            output: { intent: result.intent, confidence: result.confidence },
            variables: {
                last_intent: result.intent,
                last_confidence: result.confidence,
            },
            nextNodeId: matchedIntent.targetNodeId,
        };
    } catch (error) {
        // Fallback to rules-based routing if LLM fails
        if (config.model?.provider === 'rules' || config.fallbackIntent) {
            const fallbackIntentDef = config.intents.find(i => i.name === config.fallbackIntent);
            return {
                output: { intent: config.fallbackIntent || 'fallback', confidence: 0, error: true },
                variables: { last_intent: config.fallbackIntent || 'fallback' },
                nextNodeId: fallbackIntentDef?.targetNodeId,
            };
        }
        throw error;
    }
}

/**
 * Knowledge Search Node Handler
 */
async function handleKnowledgeSearch(context: ExecutionContext): Promise<NodeResult> {
    const node = context.node as KnowledgeSearchNode;
    const { config } = node;

    const query = interpolate(config.query, context.session.variables);

    const result = await context.services.knowledge.search({
        knowledgeBaseId: config.knowledgeBaseId,
        query,
        topK: config.topK ?? 3,
        minScore: config.minScore ?? 0.5,
    });

    // Check if we got grounded results when required
    if (config.groundedOnly && !result.grounded) {
        return {
            output: { ...result, grounded: false },
            variables: {
                [config.resultVariable]: {
                    answer: '',
                    sources: [],
                    confidence: 0,
                    grounded: false,
                },
            },
        };
    }

    return {
        output: result,
        variables: {
            [config.resultVariable]: result,
        },
    };
}

/**
 * Tool Call Node Handler
 */
async function handleToolCall(context: ExecutionContext): Promise<NodeResult> {
    const node = context.node as ToolCallNode;
    const { config } = node;

    // Interpolate input values
    const processedInputs: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(config.inputs)) {
        if (typeof value === 'string') {
            processedInputs[key] = interpolate(value, context.session.variables);
        } else {
            processedInputs[key] = value;
        }
    }

    try {
        const result = await context.services.tools.execute({
            toolId: config.toolId,
            inputs: processedInputs,
            timeout: config.timeout,
        });

        if (!result.success) {
            // Handle error based on config
            if (config.onError) {
                switch (config.onError.action) {
                    case 'continue':
                        return {
                            output: { error: result.error, success: false },
                            variables: {
                                [config.resultVariable]: { error: result.error, success: false },
                            },
                        };
                    case 'goto':
                        return {
                            output: { error: result.error },
                            nextNodeId: config.onError.targetNodeId,
                        };
                    case 'escalate':
                        return {
                            output: { error: result.error },
                            // Will be handled by finding escalate node
                        };
                }
            }

            return {
                error: {
                    code: 'TOOL_CALL_FAILED',
                    message: result.error || 'Tool call failed',
                },
            };
        }

        return {
            output: result.output,
            variables: {
                [config.resultVariable]: result.output,
            },
        };
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';

        if (config.onError?.action === 'continue') {
            return {
                output: { error: errorMessage, success: false },
                variables: {
                    [config.resultVariable]: { error: errorMessage, success: false },
                },
            };
        }

        return {
            error: {
                code: 'TOOL_CALL_ERROR',
                message: errorMessage,
            },
        };
    }
}

/**
 * Condition Node Handler
 */
async function handleCondition(context: ExecutionContext): Promise<NodeResult> {
    const node = context.node as ConditionNode;
    const { config } = node;

    // Evaluate conditions in order
    for (const condition of config.conditions) {
        const value = getNestedValue(context.session.variables, condition.variable);
        const matches = evaluateCondition(condition.operator, value, condition.value);

        if (matches) {
            return {
                output: {
                    matchedCondition: condition.id,
                    variable: condition.variable,
                    value
                },
                nextNodeId: condition.targetNodeId,
            };
        }
    }

    // No condition matched - use default
    return {
        output: { matchedCondition: null, default: true },
        nextNodeId: config.defaultNodeId,
    };
}

/**
 * Get nested value from object using dot notation
 */
function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
    const parts = path.split('.');
    let current: unknown = obj;

    for (const part of parts) {
        if (current === null || current === undefined) return undefined;
        current = (current as Record<string, unknown>)[part];
    }

    return current;
}

/**
 * Escalate Node Handler
 */
async function handleEscalate(context: ExecutionContext): Promise<NodeResult> {
    const node = context.node as EscalateNode;
    const { config } = node;

    const message = config.handoffMessage
        ? interpolate(config.handoffMessage, context.session.variables)
        : undefined;

    context.emit({
        type: 'session_escalated',
        sessionId: context.session.id,
        reason: config.reason
    });

    // In a real implementation, this would integrate with a CCaaS platform
    return {
        message,
        output: {
            escalated: true,
            reason: config.reason,
            queue: config.queue,
            priority: config.priority,
            context: config.context,
        },
        end: true,
    };
}

/**
 * End Node Handler
 */
async function handleEnd(context: ExecutionContext): Promise<NodeResult> {
    const node = context.node as EndNode;
    const { config } = node;

    let message: string | undefined;
    if (config.message) {
        message = interpolate(config.message, context.session.variables);
    }

    return {
        message,
        output: {
            status: config.status,
            summary: config.summary,
        },
        end: true,
    };
}
