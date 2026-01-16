/**
 * IVAkit Utility Functions
 * 
 * Common utilities used across the platform.
 */

import type { FlowDefinition, FlowNode, FlowEdge, SessionState } from '../types';

// ============================================================================
// ID Generation
// ============================================================================

/**
 * Generate a unique ID with optional prefix
 */
export function generateId(prefix?: string): string {
    const timestamp = Date.now().toString(36);
    const randomPart = Math.random().toString(36).substring(2, 10);
    const id = `${timestamp}${randomPart}`;
    return prefix ? `${prefix}_${id}` : id;
}

/**
 * Generate a flow-specific node ID
 */
export function generateNodeId(): string {
    return generateId('node');
}

/**
 * Generate a flow-specific edge ID
 */
export function generateEdgeId(): string {
    return generateId('edge');
}

/**
 * Generate a session ID
 */
export function generateSessionId(): string {
    return generateId('session');
}

// ============================================================================
// Variable Interpolation
// ============================================================================

/**
 * Interpolate variables in a template string
 * Supports {{variableName}} syntax
 */
export function interpolate(
    template: string,
    variables: Record<string, unknown>
): string {
    return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
        const value = variables[key];
        if (value === undefined || value === null) {
            return match; // Keep original if not found
        }
        return String(value);
    });
}

/**
 * Extract variable names from a template string
 */
export function extractVariables(template: string): string[] {
    const matches = template.matchAll(/\{\{(\w+)\}\}/g);
    return [...new Set([...matches].map(m => m[1]))];
}

// ============================================================================
// Flow Utilities
// ============================================================================

/**
 * Find a node by ID in a flow
 */
export function findNode(flow: FlowDefinition, nodeId: string): FlowNode | undefined {
    return flow.nodes.find(n => n.id === nodeId);
}

/**
 * Find edges connected to a node
 */
export function findConnectedEdges(
    flow: FlowDefinition,
    nodeId: string,
    direction: 'incoming' | 'outgoing' | 'both' = 'both'
): FlowEdge[] {
    return flow.edges.filter(edge => {
        if (direction === 'incoming') return edge.target === nodeId;
        if (direction === 'outgoing') return edge.source === nodeId;
        return edge.source === nodeId || edge.target === nodeId;
    });
}

/**
 * Get the next node(s) from a given node
 */
export function getNextNodes(flow: FlowDefinition, nodeId: string): FlowNode[] {
    const outgoingEdges = findConnectedEdges(flow, nodeId, 'outgoing');
    return outgoingEdges
        .map(edge => findNode(flow, edge.target))
        .filter((n): n is FlowNode => n !== undefined);
}

/**
 * Validate flow structure
 */
export function validateFlow(flow: FlowDefinition): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Check entry node exists
    const entryNode = findNode(flow, flow.entryNode);
    if (!entryNode) {
        errors.push(`Entry node "${flow.entryNode}" not found`);
    } else if (entryNode.type !== 'start') {
        errors.push(`Entry node must be of type "start"`);
    }

    // Check for orphan nodes (no incoming or outgoing edges, except start/end)
    for (const node of flow.nodes) {
        const edges = findConnectedEdges(flow, node.id);
        if (edges.length === 0 && node.type !== 'start') {
            errors.push(`Node "${node.name}" (${node.id}) has no connections`);
        }
    }

    // Check edge references valid nodes
    for (const edge of flow.edges) {
        if (!findNode(flow, edge.source)) {
            errors.push(`Edge "${edge.id}" references non-existent source node "${edge.source}"`);
        }
        if (!findNode(flow, edge.target)) {
            errors.push(`Edge "${edge.id}" references non-existent target node "${edge.target}"`);
        }
    }

    // Check for cycles that don't go through an input node (infinite loops)
    // This is a simplified check - a full cycle detection would be more complex
    const hasEndNode = flow.nodes.some(n => n.type === 'end');
    if (!hasEndNode) {
        errors.push('Flow must have at least one End node');
    }

    return { valid: errors.length === 0, errors };
}

// ============================================================================
// Session Utilities
// ============================================================================

/**
 * Create a new session state
 */
export function createSession(flowId: string, entryNodeId: string): SessionState {
    const now = new Date().toISOString();
    return {
        id: generateSessionId(),
        flowId,
        currentNodeId: entryNodeId,
        variables: {},
        history: [],
        status: 'active',
        createdAt: now,
        updatedAt: now,
    };
}

/**
 * Clone a session state (for immutable updates)
 */
export function cloneSession(session: SessionState): SessionState {
    return {
        ...session,
        variables: { ...session.variables },
        history: [...session.history],
        metadata: session.metadata ? { ...session.metadata } : undefined,
    };
}

// ============================================================================
// Formatting Utilities
// ============================================================================

/**
 * Format duration in ms to human readable
 */
export function formatDuration(ms: number): string {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    if (ms < 3600000) return `${Math.floor(ms / 60000)}m ${Math.floor((ms % 60000) / 1000)}s`;
    return `${Math.floor(ms / 3600000)}h ${Math.floor((ms % 3600000) / 60000)}m`;
}

/**
 * Format bytes to human readable
 */
export function formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

/**
 * Truncate text with ellipsis
 */
export function truncate(text: string, maxLength: number): string {
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength - 3) + '...';
}

// ============================================================================
// Condition Evaluation
// ============================================================================

/**
 * Evaluate a condition against a value
 */
export function evaluateCondition(
    operator: string,
    actual: unknown,
    expected: unknown
): boolean {
    const actualStr = String(actual ?? '');
    const expectedStr = String(expected ?? '');
    const actualNum = Number(actual);
    const expectedNum = Number(expected);

    switch (operator) {
        case 'equals':
            return actual === expected || actualStr === expectedStr;
        case 'not_equals':
            return actual !== expected && actualStr !== expectedStr;
        case 'contains':
            return actualStr.includes(expectedStr);
        case 'not_contains':
            return !actualStr.includes(expectedStr);
        case 'starts_with':
            return actualStr.startsWith(expectedStr);
        case 'ends_with':
            return actualStr.endsWith(expectedStr);
        case 'greater_than':
            return !isNaN(actualNum) && !isNaN(expectedNum) && actualNum > expectedNum;
        case 'less_than':
            return !isNaN(actualNum) && !isNaN(expectedNum) && actualNum < expectedNum;
        case 'greater_or_equal':
            return !isNaN(actualNum) && !isNaN(expectedNum) && actualNum >= expectedNum;
        case 'less_or_equal':
            return !isNaN(actualNum) && !isNaN(expectedNum) && actualNum <= expectedNum;
        case 'is_empty':
            return actual === null || actual === undefined || actualStr === '';
        case 'is_not_empty':
            return actual !== null && actual !== undefined && actualStr !== '';
        case 'matches_regex':
            try {
                return new RegExp(expectedStr).test(actualStr);
            } catch {
                return false;
            }
        default:
            return false;
    }
}

// ============================================================================
// Deep Clone
// ============================================================================

/**
 * Deep clone an object (simple implementation)
 */
export function deepClone<T>(obj: T): T {
    return JSON.parse(JSON.stringify(obj));
}

// ============================================================================
// Debounce / Throttle
// ============================================================================

/**
 * Debounce function execution
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
    fn: T,
    delay: number
): (...args: Parameters<T>) => void {
    let timeoutId: ReturnType<typeof setTimeout>;
    return (...args: Parameters<T>) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => fn(...args), delay);
    };
}

/**
 * Throttle function execution
 */
export function throttle<T extends (...args: unknown[]) => unknown>(
    fn: T,
    limit: number
): (...args: Parameters<T>) => void {
    let inThrottle = false;
    return (...args: Parameters<T>) => {
        if (!inThrottle) {
            fn(...args);
            inThrottle = true;
            setTimeout(() => (inThrottle = false), limit);
        }
    };
}

// ============================================================================
// Color Utilities (for node types)
// ============================================================================

export const NODE_COLORS: Record<string, { bg: string; border: string; text: string }> = {
    start: { bg: '#10b981', border: '#059669', text: '#ffffff' },
    message: { bg: '#3b82f6', border: '#2563eb', text: '#ffffff' },
    collect_input: { bg: '#8b5cf6', border: '#7c3aed', text: '#ffffff' },
    llm_router: { bg: '#f59e0b', border: '#d97706', text: '#ffffff' },
    knowledge_search: { bg: '#06b6d4', border: '#0891b2', text: '#ffffff' },
    tool_call: { bg: '#ec4899', border: '#db2777', text: '#ffffff' },
    condition: { bg: '#f97316', border: '#ea580c', text: '#ffffff' },
    escalate: { bg: '#ef4444', border: '#dc2626', text: '#ffffff' },
    end: { bg: '#6b7280', border: '#4b5563', text: '#ffffff' },
};

export function getNodeColor(nodeType: string): { bg: string; border: string; text: string } {
    return NODE_COLORS[nodeType] || { bg: '#6b7280', border: '#4b5563', text: '#ffffff' };
}
