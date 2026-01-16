'use client';

import { atom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';
import { Node, Edge } from 'reactflow';

// ============================================================================
// Flow State Types
// ============================================================================

export interface FlowNodeData {
    type: string;
    name: string;
    config: Record<string, unknown>;
    description?: string;
}

export interface FlowState {
    nodes: Node<FlowNodeData>[];
    edges: Edge[];
    flowName: string;
    flowId: string;
    isDirty: boolean;
    lastSaved: Date | null;
}

export interface HistoryEntry {
    nodes: Node<FlowNodeData>[];
    edges: Edge[];
    timestamp: number;
}

// ============================================================================
// Initial Demo Data
// ============================================================================

const initialNodes: Node<FlowNodeData>[] = [
    {
        id: 'start_1',
        type: 'flowNode',
        position: { x: 250, y: 50 },
        data: {
            type: 'start',
            name: 'Start',
            config: { welcomeMessage: 'Hello! Welcome to Acme Support. How can I help you today?' }
        },
    },
    {
        id: 'collect_1',
        type: 'flowNode',
        position: { x: 250, y: 180 },
        data: {
            type: 'collect_input',
            name: 'Get Input',
            config: { prompt: '', variableName: 'user_message', validation: { type: 'text', minLength: 1 }, timeout: { seconds: 60 } }
        },
    },
    {
        id: 'router_1',
        type: 'flowNode',
        position: { x: 250, y: 310 },
        data: {
            type: 'llm_router',
            name: 'Intent Router',
            config: {
                systemPrompt: 'You are a customer support intent classifier. Analyze the customer message and classify it into one of the following intents.',
                intents: [
                    { name: 'order_status', description: 'Customer wants to check order status', targetNodeId: 'kb_1' },
                    { name: 'refund', description: 'Customer wants a refund or return', targetNodeId: 'msg_refund' },
                    { name: 'technical_support', description: 'Customer has a technical issue', targetNodeId: 'tool_1' },
                ],
                model: { provider: 'ollama', model: 'llama3.2', temperature: 0.3 },
                confidenceThreshold: 0.7,
            }
        },
    },
    {
        id: 'kb_1',
        type: 'flowNode',
        position: { x: 50, y: 440 },
        data: {
            type: 'knowledge_search',
            name: 'Search FAQ',
            config: { knowledgeBaseId: 'kb_faq', query: '{{user_message}}' }
        },
    },
    {
        id: 'msg_refund',
        type: 'flowNode',
        position: { x: 250, y: 440 },
        data: {
            type: 'message',
            name: 'Refund Info',
            config: { message: 'Our refund policy allows returns within 30 days.' }
        },
    },
    {
        id: 'tool_1',
        type: 'flowNode',
        position: { x: 450, y: 440 },
        data: {
            type: 'tool_call',
            name: 'Check Status',
            config: { toolId: 'system_status', inputs: {} }
        },
    },
    {
        id: 'condition_1',
        type: 'flowNode',
        position: { x: 50, y: 570 },
        data: {
            type: 'condition',
            name: 'Check Answer',
            config: { conditions: [{ variable: 'faq_confidence', operator: 'gte', value: 0.7, targetNodeId: 'msg_answer' }], fallbackNodeId: 'escalate_1' }
        },
    },
    {
        id: 'msg_answer',
        type: 'flowNode',
        position: { x: 50, y: 700 },
        data: {
            type: 'message',
            name: 'Provide Answer',
            config: { message: '{{faq_answer}}' }
        },
    },
    {
        id: 'escalate_1',
        type: 'flowNode',
        position: { x: 450, y: 570 },
        data: {
            type: 'escalate',
            name: 'Escalate',
            config: { reason: 'Customer requires human assistance', queue: 'tier1_support' }
        },
    },
    {
        id: 'end_1',
        type: 'flowNode',
        position: { x: 250, y: 830 },
        data: {
            type: 'end',
            name: 'End',
            config: { message: 'Thank you for contacting us. Goodbye!', status: 'completed' }
        },
    },
];

const initialEdges: Edge[] = [
    { id: 'e1', source: 'start_1', target: 'collect_1', type: 'custom' },
    { id: 'e2', source: 'collect_1', target: 'router_1', type: 'custom' },
    { id: 'e3', source: 'router_1', target: 'kb_1', type: 'custom', label: 'order_status' },
    { id: 'e4', source: 'router_1', target: 'msg_refund', type: 'custom', label: 'refund' },
    { id: 'e5', source: 'router_1', target: 'tool_1', type: 'custom', label: 'tech_support' },
    { id: 'e6', source: 'kb_1', target: 'condition_1', type: 'custom' },
    { id: 'e7', source: 'condition_1', target: 'msg_answer', type: 'custom', label: 'found' },
    { id: 'e8', source: 'condition_1', target: 'escalate_1', type: 'custom', label: 'not found' },
    { id: 'e9', source: 'msg_answer', target: 'end_1', type: 'custom' },
    { id: 'e10', source: 'msg_refund', target: 'end_1', type: 'custom' },
    { id: 'e11', source: 'tool_1', target: 'escalate_1', type: 'custom' },
];

// ============================================================================
// Atoms
// ============================================================================

// Main flow state
export const flowStateAtom = atom<FlowState>({
    nodes: initialNodes,
    edges: initialEdges,
    flowName: 'Customer Support IVA',
    flowId: 'flow_customer_support',
    isDirty: false,
    lastSaved: null,
});

// History for undo/redo
export const historyAtom = atom<{
    past: HistoryEntry[];
    future: HistoryEntry[];
}>({
    past: [],
    future: [],
});

// Current history index for tracking position
const MAX_HISTORY_LENGTH = 50;

// Selected node ID
export const selectedNodeIdAtom = atom<string | null>(null);

// UI state
export const leftPanelOpenAtom = atom<boolean>(true);
export const rightPanelOpenAtom = atom<boolean>(true);
export const simulatorOpenAtom = atom<boolean>(false);
export const settingsOpenAtom = atom<boolean>(false);

// Settings state (persisted)
export const settingsAtom = atomWithStorage('ivakit-settings', {
    theme: 'dark' as 'dark' | 'light' | 'system',
    autoSave: true,
    autoSaveInterval: 30, // seconds
    snapToGrid: true,
    gridSize: 15,
    showMinimap: true,
    showControls: true,
    aiProvider: 'ollama' as 'ollama' | 'openai' | 'anthropic',
    ollamaUrl: 'http://localhost:11434',
    ollamaModel: 'llama3.2',
    openaiApiKey: '',
    anthropicApiKey: '',
});

// ============================================================================
// Derived Atoms
// ============================================================================

// Get nodes from flow state
export const nodesAtom = atom(
    (get) => get(flowStateAtom).nodes,
    (get, set, nodes: Node<FlowNodeData>[]) => {
        const state = get(flowStateAtom);
        set(flowStateAtom, { ...state, nodes, isDirty: true });
    }
);

// Get edges from flow state
export const edgesAtom = atom(
    (get) => get(flowStateAtom).edges,
    (get, set, edges: Edge[]) => {
        const state = get(flowStateAtom);
        set(flowStateAtom, { ...state, edges, isDirty: true });
    }
);

// Node count
export const nodeCountAtom = atom((get) => get(flowStateAtom).nodes.length);

// Edge count
export const edgeCountAtom = atom((get) => get(flowStateAtom).edges.length);

// Flow validation
export const flowValidationAtom = atom((get) => {
    const { nodes, edges } = get(flowStateAtom);
    const errors: string[] = [];

    // Check for start node
    const startNodes = nodes.filter(n => n.data.type === 'start');
    if (startNodes.length === 0) {
        errors.push('Flow must have a Start node');
    } else if (startNodes.length > 1) {
        errors.push('Flow can only have one Start node');
    }

    // Check for end node
    const endNodes = nodes.filter(n => n.data.type === 'end');
    if (endNodes.length === 0) {
        errors.push('Flow must have at least one End node');
    }

    // Check for orphan nodes (no incoming or outgoing edges)
    const nodesWithEdges = new Set([
        ...edges.map(e => e.source),
        ...edges.map(e => e.target),
    ]);

    const orphanNodes = nodes.filter(n =>
        n.data.type !== 'start' &&
        n.data.type !== 'end' &&
        !nodesWithEdges.has(n.id)
    );

    if (orphanNodes.length > 0) {
        errors.push(`${orphanNodes.length} node(s) are not connected`);
    }

    return {
        isValid: errors.length === 0,
        errors,
    };
});

// Can undo/redo
export const canUndoAtom = atom((get) => get(historyAtom).past.length > 0);
export const canRedoAtom = atom((get) => get(historyAtom).future.length > 0);

// ============================================================================
// Action Atoms
// ============================================================================

// Save current state to history
export const saveToHistoryAtom = atom(null, (get, set) => {
    const { nodes, edges } = get(flowStateAtom);
    const history = get(historyAtom);

    const newEntry: HistoryEntry = {
        nodes: JSON.parse(JSON.stringify(nodes)),
        edges: JSON.parse(JSON.stringify(edges)),
        timestamp: Date.now(),
    };

    const newPast = [...history.past, newEntry].slice(-MAX_HISTORY_LENGTH);

    set(historyAtom, {
        past: newPast,
        future: [], // Clear future when new action is performed
    });
});

// Undo action
export const undoAtom = atom(null, (get, set) => {
    const history = get(historyAtom);
    if (history.past.length === 0) return;

    const { nodes, edges } = get(flowStateAtom);
    const currentEntry: HistoryEntry = {
        nodes: JSON.parse(JSON.stringify(nodes)),
        edges: JSON.parse(JSON.stringify(edges)),
        timestamp: Date.now(),
    };

    const previous = history.past[history.past.length - 1];
    const newPast = history.past.slice(0, -1);

    set(historyAtom, {
        past: newPast,
        future: [currentEntry, ...history.future],
    });

    set(flowStateAtom, (state) => ({
        ...state,
        nodes: previous.nodes,
        edges: previous.edges,
        isDirty: true,
    }));
});

// Redo action
export const redoAtom = atom(null, (get, set) => {
    const history = get(historyAtom);
    if (history.future.length === 0) return;

    const { nodes, edges } = get(flowStateAtom);
    const currentEntry: HistoryEntry = {
        nodes: JSON.parse(JSON.stringify(nodes)),
        edges: JSON.parse(JSON.stringify(edges)),
        timestamp: Date.now(),
    };

    const next = history.future[0];
    const newFuture = history.future.slice(1);

    set(historyAtom, {
        past: [...history.past, currentEntry],
        future: newFuture,
    });

    set(flowStateAtom, (state) => ({
        ...state,
        nodes: next.nodes,
        edges: next.edges,
        isDirty: true,
    }));
});

// Update node data
export const updateNodeDataAtom = atom(
    null,
    (get, set, { nodeId, data }: { nodeId: string; data: Partial<FlowNodeData> }) => {
        // Save to history before making changes
        set(saveToHistoryAtom);

        const state = get(flowStateAtom);
        const nodes = state.nodes.map(node => {
            if (node.id === nodeId) {
                return {
                    ...node,
                    data: {
                        ...node.data,
                        ...data,
                        config: data.config ? { ...node.data.config, ...data.config } : node.data.config,
                    },
                };
            }
            return node;
        });

        set(flowStateAtom, { ...state, nodes, isDirty: true });
    }
);

// Delete node
export const deleteNodeAtom = atom(null, (get, set, nodeId: string) => {
    // Save to history before making changes
    set(saveToHistoryAtom);

    const state = get(flowStateAtom);
    const nodes = state.nodes.filter(n => n.id !== nodeId);
    const edges = state.edges.filter(e => e.source !== nodeId && e.target !== nodeId);

    set(flowStateAtom, { ...state, nodes, edges, isDirty: true });

    // Deselect if deleted node was selected
    if (get(selectedNodeIdAtom) === nodeId) {
        set(selectedNodeIdAtom, null);
    }
});

// Duplicate node
export const duplicateNodeAtom = atom(null, (get, set, nodeId: string) => {
    // Save to history before making changes
    set(saveToHistoryAtom);

    const state = get(flowStateAtom);
    const node = state.nodes.find(n => n.id === nodeId);

    if (!node) return;

    const newNode: Node<FlowNodeData> = {
        ...node,
        id: `${node.data.type}_${Date.now()}`,
        position: {
            x: node.position.x + 50,
            y: node.position.y + 50,
        },
        data: {
            ...node.data,
            name: `${node.data.name} (Copy)`,
        },
        selected: false,
    };

    set(flowStateAtom, {
        ...state,
        nodes: [...state.nodes, newNode],
        isDirty: true,
    });

    // Select the new node
    set(selectedNodeIdAtom, newNode.id);
});

// Mark as saved
export const markAsSavedAtom = atom(null, (get, set) => {
    set(flowStateAtom, (state) => ({
        ...state,
        isDirty: false,
        lastSaved: new Date(),
    }));
});

// Update flow name
export const updateFlowNameAtom = atom(null, (get, set, name: string) => {
    set(flowStateAtom, (state) => ({
        ...state,
        flowName: name,
        isDirty: true,
    }));
});
