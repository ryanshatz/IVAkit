'use client';

import { useCallback, useMemo, useEffect, useRef } from 'react';
import ReactFlow, {
    Background,
    Controls,
    MiniMap,
    Node,
    Edge,
    useNodesState,
    useEdgesState,
    addEdge,
    Connection,
    NodeTypes,
    EdgeTypes,
    Panel,
    MarkerType,
    BackgroundVariant,
    NodeChange,
    EdgeChange,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { motion } from 'framer-motion';
import { Grid3X3 } from 'lucide-react';
import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import { FlowNode } from './nodes/flow-node';
import { CustomEdge } from './edges/custom-edge';
import { Button } from '@/components/ui/button';
import {
    flowStateAtom,
    selectedNodeIdAtom,
    saveToHistoryAtom,
    settingsAtom,
    FlowNodeData,
} from '@/store/flow-store';

interface FlowBuilderProps {
    onNodeSelect: (nodeId: string | null) => void;
    selectedNodeId: string | null;
}

export function FlowBuilder({ onNodeSelect, selectedNodeId }: FlowBuilderProps) {
    const [flowState, setFlowState] = useAtom(flowStateAtom);
    const settings = useAtomValue(settingsAtom);
    const saveToHistory = useSetAtom(saveToHistoryAtom);

    // Local state for React Flow
    const [nodes, setNodes, onNodesChange] = useNodesState(flowState.nodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState(flowState.edges);

    // Track if we're syncing from store (to avoid infinite loops)
    const isSyncingFromStore = useRef(false);

    // Sync from store to local state when store changes
    useEffect(() => {
        isSyncingFromStore.current = true;
        setNodes(flowState.nodes);
        setEdges(flowState.edges);
        isSyncingFromStore.current = false;
    }, [flowState.nodes, flowState.edges, setNodes, setEdges]);

    // Sync local state back to store (debounced)
    const syncTimeoutRef = useRef<NodeJS.Timeout>();

    const syncToStore = useCallback((newNodes: Node<FlowNodeData>[], newEdges: Edge[]) => {
        if (isSyncingFromStore.current) return;

        if (syncTimeoutRef.current) {
            clearTimeout(syncTimeoutRef.current);
        }

        syncTimeoutRef.current = setTimeout(() => {
            setFlowState(state => ({
                ...state,
                nodes: newNodes,
                edges: newEdges,
                isDirty: true,
            }));
        }, 100);
    }, [setFlowState]);

    const nodeTypes: NodeTypes = useMemo(() => ({
        flowNode: FlowNode,
    }), []);

    const edgeTypes: EdgeTypes = useMemo(() => ({
        custom: CustomEdge,
    }), []);

    // Handle nodes change with history
    const handleNodesChange = useCallback((changes: NodeChange[]) => {
        // Detect if this is a drag or resize (which should save to history)
        const shouldSaveHistory = changes.some(change =>
            change.type === 'remove' ||
            (change.type === 'position' && change.dragging === false)
        );

        if (shouldSaveHistory) {
            saveToHistory();
        }

        onNodesChange(changes);

        // Get the updated nodes after the change
        setNodes((nds) => {
            syncToStore(nds, edges);
            return nds;
        });
    }, [onNodesChange, saveToHistory, setNodes, edges, syncToStore]);

    // Handle edges change with history
    const handleEdgesChange = useCallback((changes: EdgeChange[]) => {
        const shouldSaveHistory = changes.some(change => change.type === 'remove');

        if (shouldSaveHistory) {
            saveToHistory();
        }

        onEdgesChange(changes);

        // Get the updated edges after the change
        setEdges((eds) => {
            syncToStore(nodes, eds);
            return eds;
        });
    }, [onEdgesChange, saveToHistory, setEdges, nodes, syncToStore]);

    const onConnect = useCallback(
        (params: Connection) => {
            saveToHistory();
            setEdges((eds) => {
                const newEdges = addEdge({
                    ...params,
                    type: 'custom',
                    markerEnd: { type: MarkerType.ArrowClosed },
                }, eds);
                syncToStore(nodes, newEdges);
                return newEdges;
            });
        },
        [setEdges, saveToHistory, nodes, syncToStore]
    );

    const onNodeClick = useCallback(
        (_: React.MouseEvent, node: Node) => {
            onNodeSelect(node.id);
        },
        [onNodeSelect]
    );

    const onPaneClick = useCallback(() => {
        onNodeSelect(null);
    }, [onNodeSelect]);

    const onDragOver = useCallback((event: React.DragEvent) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
    }, []);

    const onDrop = useCallback(
        (event: React.DragEvent) => {
            event.preventDefault();

            const type = event.dataTransfer.getData('application/reactflow');
            if (!type) return;

            const reactFlowBounds = (event.target as Element)
                .closest('.react-flow')
                ?.getBoundingClientRect();

            if (!reactFlowBounds) return;

            // Save to history before adding node
            saveToHistory();

            const position = {
                x: event.clientX - reactFlowBounds.left - 100,
                y: event.clientY - reactFlowBounds.top - 30,
            };

            // Get default config for node type
            const defaultConfigs: Record<string, Record<string, unknown>> = {
                start: { welcomeMessage: 'Hello! How can I help you today?' },
                message: { message: '', delay: 0 },
                collect_input: { variableName: 'user_input', validation: { type: 'text' }, timeout: { seconds: 60 } },
                llm_router: { systemPrompt: 'Classify the user intent.', intents: [], model: { provider: 'ollama', model: 'llama3.2' } },
                knowledge_search: { knowledgeBaseId: '', query: '{{user_message}}' },
                tool_call: { toolId: '', inputs: {} },
                condition: { conditions: [], fallbackNodeId: '' },
                escalate: { reason: '', queue: '' },
                end: { message: 'Goodbye!', status: 'completed' },
            };

            const newNode: Node<FlowNodeData> = {
                id: `${type}_${Date.now()}`,
                type: 'flowNode',
                position,
                data: {
                    type,
                    name: type.split('_').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
                    config: defaultConfigs[type] || {},
                },
            };

            setNodes((nds) => {
                const updatedNodes = nds.concat(newNode);
                syncToStore(updatedNodes, edges);
                return updatedNodes;
            });

            // Select the new node
            onNodeSelect(newNode.id);
        },
        [setNodes, saveToHistory, edges, syncToStore, onNodeSelect]
    );

    // Update nodes with selection state
    const nodesWithSelection = useMemo(() => {
        return nodes.map(node => ({
            ...node,
            selected: node.id === selectedNodeId,
        }));
    }, [nodes, selectedNodeId]);

    return (
        <motion.div
            className="h-full w-full"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
        >
            <ReactFlow
                nodes={nodesWithSelection}
                edges={edges}
                onNodesChange={handleNodesChange}
                onEdgesChange={handleEdgesChange}
                onConnect={onConnect}
                onNodeClick={onNodeClick}
                onPaneClick={onPaneClick}
                onDragOver={onDragOver}
                onDrop={onDrop}
                nodeTypes={nodeTypes}
                edgeTypes={edgeTypes}
                snapToGrid={settings.snapToGrid}
                snapGrid={[settings.gridSize, settings.gridSize]}
                fitView
                fitViewOptions={{ padding: 0.2 }}
                defaultEdgeOptions={{
                    type: 'custom',
                    markerEnd: { type: MarkerType.ArrowClosed },
                }}
                proOptions={{ hideAttribution: true }}
            >
                <Background
                    variant={BackgroundVariant.Dots}
                    gap={20}
                    size={1}
                    className="bg-background"
                />
                {settings.showControls && (
                    <Controls
                        showInteractive={false}
                        className="!bg-card !border-border !shadow-lg"
                    />
                )}
                {settings.showMinimap && (
                    <MiniMap
                        className="!bg-card !border-border"
                        nodeColor={(node) => {
                            const colors: Record<string, string> = {
                                start: '#10b981',
                                message: '#3b82f6',
                                collect_input: '#8b5cf6',
                                llm_router: '#f59e0b',
                                knowledge_search: '#06b6d4',
                                tool_call: '#ec4899',
                                condition: '#f97316',
                                escalate: '#ef4444',
                                end: '#6b7280',
                            };
                            return colors[(node.data as FlowNodeData).type] || '#6b7280';
                        }}
                    />
                )}

                {/* Custom Panel */}
                <Panel position="top-right" className="flex gap-2">
                    <Button
                        variant={settings.snapToGrid ? "default" : "outline"}
                        size="icon"
                        className="h-8 w-8"
                        title="Toggle Snap to Grid"
                    >
                        <Grid3X3 className="h-4 w-4" />
                    </Button>
                </Panel>
            </ReactFlow>
        </motion.div>
    );
}
