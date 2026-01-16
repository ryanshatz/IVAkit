'use client';

import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Settings, Trash2, Copy, ChevronDown, ChevronUp, Plus } from 'lucide-react';
import { useAtomValue, useSetAtom } from 'jotai';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
    flowStateAtom,
    updateNodeDataAtom,
    deleteNodeAtom,
    duplicateNodeAtom,
    FlowNodeData,
} from '@/store/flow-store';

interface ConfigPanelProps {
    selectedNodeId: string | null;
    onClose: () => void;
}

export function ConfigPanel({ selectedNodeId, onClose }: ConfigPanelProps) {
    const [expandedSections, setExpandedSections] = useState<string[]>(['basic', 'config']);
    const flowState = useAtomValue(flowStateAtom);
    const updateNodeData = useSetAtom(updateNodeDataAtom);
    const deleteNode = useSetAtom(deleteNodeAtom);
    const duplicateNode = useSetAtom(duplicateNodeAtom);

    // Local state for form values
    const [localData, setLocalData] = useState<FlowNodeData | null>(null);

    // Get the selected node from the flow state
    const selectedNode = selectedNodeId
        ? flowState.nodes.find(n => n.id === selectedNodeId)
        : null;

    // Sync local data when selected node changes
    useEffect(() => {
        if (selectedNode) {
            setLocalData({ ...selectedNode.data });
        } else {
            setLocalData(null);
        }
    }, [selectedNode]);

    const toggleSection = (section: string) => {
        setExpandedSections(prev =>
            prev.includes(section)
                ? prev.filter(s => s !== section)
                : [...prev, section]
        );
    };

    // Update local data
    const updateLocal = useCallback((updates: Partial<FlowNodeData>) => {
        setLocalData(prev => prev ? { ...prev, ...updates } : null);
    }, []);

    // Update local config
    const updateLocalConfig = useCallback((key: string, value: unknown) => {
        setLocalData(prev => {
            if (!prev) return null;
            return {
                ...prev,
                config: { ...prev.config, [key]: value },
            };
        });
    }, []);

    // Save changes to store
    const handleSaveChanges = useCallback(() => {
        if (!selectedNodeId || !localData) return;
        updateNodeData({ nodeId: selectedNodeId, data: localData });
    }, [selectedNodeId, localData, updateNodeData]);

    // Handle delete
    const handleDelete = useCallback(() => {
        if (!selectedNodeId) return;
        if (confirm('Are you sure you want to delete this node?')) {
            deleteNode(selectedNodeId);
            onClose();
        }
    }, [selectedNodeId, deleteNode, onClose]);

    // Handle duplicate
    const handleDuplicate = useCallback(() => {
        if (!selectedNodeId) return;
        duplicateNode(selectedNodeId);
    }, [selectedNodeId, duplicateNode]);

    if (!selectedNodeId || !localData) {
        return (
            <div className="flex h-full flex-col items-center justify-center p-8 text-center">
                <div className="mb-4 rounded-full bg-muted p-4">
                    <Settings className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-medium">No Node Selected</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                    Click on a node in the canvas to configure it
                </p>
            </div>
        );
    }

    // Check if data has changed
    const hasChanges = selectedNode && JSON.stringify(selectedNode.data) !== JSON.stringify(localData);

    return (
        <div className="flex h-full flex-col">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border p-4">
                <div>
                    <h2 className="text-sm font-semibold">Configure Node</h2>
                    <p className="text-xs text-muted-foreground capitalize">{localData.type.replace(/_/g, ' ')}</p>
                </div>
                <div className="flex items-center gap-1">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={handleDuplicate}
                        title="Duplicate Node"
                    >
                        <Copy className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={handleDelete}
                        title="Delete Node"
                    >
                        <Trash2 className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose}>
                        <X className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4">
                {/* Basic Section */}
                <ConfigSection
                    title="Basic"
                    isExpanded={expandedSections.includes('basic')}
                    onToggle={() => toggleSection('basic')}
                >
                    <div className="space-y-4">
                        <div>
                            <label className="text-xs font-medium text-muted-foreground">Node Name</label>
                            <input
                                type="text"
                                value={localData.name}
                                onChange={(e) => updateLocal({ name: e.target.value })}
                                className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-ring"
                            />
                        </div>
                        <div>
                            <label className="text-xs font-medium text-muted-foreground">Description</label>
                            <textarea
                                rows={2}
                                value={localData.description || ''}
                                onChange={(e) => updateLocal({ description: e.target.value })}
                                placeholder="Optional description..."
                                className="mt-1 w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-ring"
                            />
                        </div>
                    </div>
                </ConfigSection>

                {/* Configuration Section */}
                <ConfigSection
                    title="Configuration"
                    isExpanded={expandedSections.includes('config')}
                    onToggle={() => toggleSection('config')}
                >
                    {localData.type === 'start' && (
                        <StartNodeConfig
                            config={localData.config}
                            onChange={updateLocalConfig}
                        />
                    )}
                    {localData.type === 'message' && (
                        <MessageNodeConfig
                            config={localData.config}
                            onChange={updateLocalConfig}
                        />
                    )}
                    {localData.type === 'collect_input' && (
                        <CollectInputNodeConfig
                            config={localData.config}
                            onChange={updateLocalConfig}
                        />
                    )}
                    {localData.type === 'llm_router' && (
                        <LLMRouterNodeConfig
                            config={localData.config}
                            onChange={updateLocalConfig}
                        />
                    )}
                    {localData.type === 'knowledge_search' && (
                        <KnowledgeSearchNodeConfig
                            config={localData.config}
                            onChange={updateLocalConfig}
                        />
                    )}
                    {localData.type === 'tool_call' && (
                        <ToolCallNodeConfig
                            config={localData.config}
                            onChange={updateLocalConfig}
                        />
                    )}
                    {localData.type === 'condition' && (
                        <ConditionNodeConfig
                            config={localData.config}
                            onChange={updateLocalConfig}
                        />
                    )}
                    {localData.type === 'escalate' && (
                        <EscalateNodeConfig
                            config={localData.config}
                            onChange={updateLocalConfig}
                        />
                    )}
                    {localData.type === 'end' && (
                        <EndNodeConfig
                            config={localData.config}
                            onChange={updateLocalConfig}
                        />
                    )}
                </ConfigSection>

                {/* Node ID (read-only) */}
                <ConfigSection
                    title="Advanced"
                    isExpanded={expandedSections.includes('advanced')}
                    onToggle={() => toggleSection('advanced')}
                >
                    <div className="space-y-2">
                        <div>
                            <label className="text-xs font-medium text-muted-foreground">Node ID</label>
                            <input
                                type="text"
                                value={selectedNodeId}
                                readOnly
                                className="mt-1 w-full rounded-md border border-input bg-muted px-3 py-2 font-mono text-xs outline-none"
                            />
                        </div>
                        <div>
                            <label className="text-xs font-medium text-muted-foreground">Raw Config</label>
                            <pre className="mt-1 w-full rounded-md border border-input bg-muted p-2 font-mono text-xs overflow-auto max-h-32">
                                {JSON.stringify(localData.config, null, 2)}
                            </pre>
                        </div>
                    </div>
                </ConfigSection>
            </div>

            {/* Footer */}
            <div className="border-t border-border p-4">
                <Button
                    className="w-full"
                    onClick={handleSaveChanges}
                    disabled={!hasChanges}
                >
                    {hasChanges ? 'Save Changes' : 'No Changes'}
                </Button>
            </div>
        </div>
    );
}

// Section Component
function ConfigSection({
    title,
    isExpanded,
    onToggle,
    children
}: {
    title: string;
    isExpanded: boolean;
    onToggle: () => void;
    children: React.ReactNode;
}) {
    return (
        <div className="mb-4">
            <button
                onClick={onToggle}
                className="flex w-full items-center justify-between rounded-lg bg-muted/50 px-3 py-2 text-left text-sm font-medium hover:bg-muted"
            >
                {title}
                {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                    >
                        <div className="pt-4">
                            {children}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

// ============================================================================
// Node-specific config components
// ============================================================================

interface NodeConfigProps {
    config: Record<string, unknown>;
    onChange: (key: string, value: unknown) => void;
}

function StartNodeConfig({ config, onChange }: NodeConfigProps) {
    return (
        <div className="space-y-4">
            <div>
                <label className="text-xs font-medium text-muted-foreground">Welcome Message</label>
                <textarea
                    rows={3}
                    value={(config.welcomeMessage as string) || ''}
                    onChange={(e) => onChange('welcomeMessage', e.target.value)}
                    className="mt-1 w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-ring"
                />
                <p className="mt-1 text-xs text-muted-foreground">
                    Supports {"{{variable}}"} interpolation
                </p>
            </div>
        </div>
    );
}

function MessageNodeConfig({ config, onChange }: NodeConfigProps) {
    return (
        <div className="space-y-4">
            <div>
                <label className="text-xs font-medium text-muted-foreground">Message</label>
                <textarea
                    rows={5}
                    value={(config.message as string) || ''}
                    onChange={(e) => onChange('message', e.target.value)}
                    placeholder="Enter your message..."
                    className="mt-1 w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-ring"
                />
                <p className="mt-1 text-xs text-muted-foreground">
                    Supports {"{{variable}}"} interpolation and Markdown
                </p>
            </div>
            <div>
                <label className="text-xs font-medium text-muted-foreground">Delay (ms)</label>
                <input
                    type="number"
                    value={(config.delay as number) || 0}
                    onChange={(e) => onChange('delay', parseInt(e.target.value) || 0)}
                    min={0}
                    step={100}
                    className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-ring"
                />
            </div>
        </div>
    );
}

function CollectInputNodeConfig({ config, onChange }: NodeConfigProps) {
    return (
        <div className="space-y-4">
            <div>
                <label className="text-xs font-medium text-muted-foreground">Prompt (optional)</label>
                <textarea
                    rows={2}
                    value={(config.prompt as string) || ''}
                    onChange={(e) => onChange('prompt', e.target.value)}
                    placeholder="Message to show before collecting input..."
                    className="mt-1 w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-ring"
                />
            </div>
            <div>
                <label className="text-xs font-medium text-muted-foreground">Store in Variable</label>
                <input
                    type="text"
                    value={(config.variableName as string) || ''}
                    onChange={(e) => onChange('variableName', e.target.value)}
                    className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 font-mono text-sm outline-none focus:ring-1 focus:ring-ring"
                />
            </div>
            <div>
                <label className="text-xs font-medium text-muted-foreground">Validation Type</label>
                <select
                    value={(config.validation as { type: string })?.type || 'text'}
                    onChange={(e) => onChange('validation', { ...config.validation as object, type: e.target.value })}
                    className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-ring"
                >
                    <option value="text">Text</option>
                    <option value="email">Email</option>
                    <option value="phone">Phone</option>
                    <option value="number">Number</option>
                    <option value="regex">Custom Regex</option>
                </select>
            </div>
            <div>
                <label className="text-xs font-medium text-muted-foreground">Timeout (seconds)</label>
                <input
                    type="number"
                    value={(config.timeout as { seconds: number })?.seconds || 60}
                    onChange={(e) => onChange('timeout', { seconds: parseInt(e.target.value) || 60 })}
                    className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-ring"
                />
            </div>
        </div>
    );
}

function LLMRouterNodeConfig({ config, onChange }: NodeConfigProps) {
    const intents = (config.intents as Array<{ name: string; description: string; targetNodeId: string }>) || [];

    const addIntent = () => {
        onChange('intents', [...intents, { name: '', description: '', targetNodeId: '' }]);
    };

    const updateIntent = (index: number, field: string, value: string) => {
        const newIntents = [...intents];
        newIntents[index] = { ...newIntents[index], [field]: value };
        onChange('intents', newIntents);
    };

    const removeIntent = (index: number) => {
        onChange('intents', intents.filter((_, i) => i !== index));
    };

    return (
        <div className="space-y-4">
            <div>
                <label className="text-xs font-medium text-muted-foreground">System Prompt</label>
                <textarea
                    rows={4}
                    value={(config.systemPrompt as string) || ''}
                    onChange={(e) => onChange('systemPrompt', e.target.value)}
                    className="mt-1 w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-ring"
                />
            </div>
            <div>
                <label className="text-xs font-medium text-muted-foreground">Model</label>
                <div className="mt-1 grid grid-cols-2 gap-2">
                    <select
                        value={(config.model as { provider: string })?.provider || 'ollama'}
                        onChange={(e) => onChange('model', { ...config.model as object, provider: e.target.value })}
                        className="rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-ring"
                    >
                        <option value="ollama">Ollama (Local)</option>
                        <option value="openai">OpenAI</option>
                        <option value="anthropic">Anthropic</option>
                        <option value="rules">Rules (No AI)</option>
                    </select>
                    <input
                        type="text"
                        value={(config.model as { model: string })?.model || 'llama3.2'}
                        onChange={(e) => onChange('model', { ...config.model as object, model: e.target.value })}
                        className="rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-ring"
                    />
                </div>
            </div>
            <div>
                <label className="text-xs font-medium text-muted-foreground">Intents</label>
                <div className="mt-2 space-y-2">
                    {intents.map((intent, i) => (
                        <div key={i} className="rounded-lg bg-muted p-3 space-y-2">
                            <div className="flex items-center justify-between">
                                <input
                                    type="text"
                                    value={intent.name}
                                    onChange={(e) => updateIntent(i, 'name', e.target.value)}
                                    placeholder="Intent name"
                                    className="flex-1 bg-transparent text-sm font-medium outline-none"
                                />
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6"
                                    onClick={() => removeIntent(i)}
                                >
                                    <X className="h-3 w-3" />
                                </Button>
                            </div>
                            <input
                                type="text"
                                value={intent.description}
                                onChange={(e) => updateIntent(i, 'description', e.target.value)}
                                placeholder="Description..."
                                className="w-full bg-transparent text-xs text-muted-foreground outline-none"
                            />
                        </div>
                    ))}
                    <Button variant="outline" size="sm" className="w-full gap-2" onClick={addIntent}>
                        <Plus className="h-3 w-3" />
                        Add Intent
                    </Button>
                </div>
            </div>
            <div>
                <label className="text-xs font-medium text-muted-foreground">Confidence Threshold</label>
                <input
                    type="range"
                    min="0"
                    max="100"
                    value={((config.confidenceThreshold as number) || 0.7) * 100}
                    onChange={(e) => onChange('confidenceThreshold', parseInt(e.target.value) / 100)}
                    className="mt-2 w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                    <span>0%</span>
                    <span>{(((config.confidenceThreshold as number) || 0.7) * 100).toFixed(0)}%</span>
                    <span>100%</span>
                </div>
            </div>
        </div>
    );
}

function KnowledgeSearchNodeConfig({ config, onChange }: NodeConfigProps) {
    return (
        <div className="space-y-4">
            <div>
                <label className="text-xs font-medium text-muted-foreground">Knowledge Base ID</label>
                <input
                    type="text"
                    value={(config.knowledgeBaseId as string) || ''}
                    onChange={(e) => onChange('knowledgeBaseId', e.target.value)}
                    placeholder="kb_..."
                    className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 font-mono text-sm outline-none focus:ring-1 focus:ring-ring"
                />
            </div>
            <div>
                <label className="text-xs font-medium text-muted-foreground">Search Query</label>
                <input
                    type="text"
                    value={(config.query as string) || ''}
                    onChange={(e) => onChange('query', e.target.value)}
                    placeholder="{{user_message}}"
                    className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-ring"
                />
                <p className="mt-1 text-xs text-muted-foreground">Use variables like {"{{user_message}}"}</p>
            </div>
            <div>
                <label className="text-xs font-medium text-muted-foreground">Top K Results</label>
                <input
                    type="number"
                    value={(config.topK as number) || 3}
                    onChange={(e) => onChange('topK', parseInt(e.target.value) || 3)}
                    min={1}
                    max={10}
                    className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-ring"
                />
            </div>
        </div>
    );
}

function ToolCallNodeConfig({ config, onChange }: NodeConfigProps) {
    return (
        <div className="space-y-4">
            <div>
                <label className="text-xs font-medium text-muted-foreground">Tool ID</label>
                <input
                    type="text"
                    value={(config.toolId as string) || ''}
                    onChange={(e) => onChange('toolId', e.target.value)}
                    placeholder="tool_..."
                    className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 font-mono text-sm outline-none focus:ring-1 focus:ring-ring"
                />
            </div>
            <div>
                <label className="text-xs font-medium text-muted-foreground">Inputs (JSON)</label>
                <textarea
                    rows={4}
                    value={JSON.stringify(config.inputs || {}, null, 2)}
                    onChange={(e) => {
                        try {
                            onChange('inputs', JSON.parse(e.target.value));
                        } catch {
                            // Invalid JSON, ignore
                        }
                    }}
                    className="mt-1 w-full resize-none rounded-md border border-input bg-background px-3 py-2 font-mono text-sm outline-none focus:ring-1 focus:ring-ring"
                />
            </div>
            <div>
                <label className="text-xs font-medium text-muted-foreground">Store Result In</label>
                <input
                    type="text"
                    value={(config.outputVariable as string) || ''}
                    onChange={(e) => onChange('outputVariable', e.target.value)}
                    placeholder="tool_result"
                    className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 font-mono text-sm outline-none focus:ring-1 focus:ring-ring"
                />
            </div>
        </div>
    );
}

function ConditionNodeConfig({ config, onChange }: NodeConfigProps) {
    const conditions = (config.conditions as Array<{ variable: string; operator: string; value: unknown; targetNodeId: string }>) || [];

    const addCondition = () => {
        onChange('conditions', [...conditions, { variable: '', operator: 'eq', value: '', targetNodeId: '' }]);
    };

    const updateCondition = (index: number, field: string, value: unknown) => {
        const newConditions = [...conditions];
        newConditions[index] = { ...newConditions[index], [field]: value };
        onChange('conditions', newConditions);
    };

    const removeCondition = (index: number) => {
        onChange('conditions', conditions.filter((_, i) => i !== index));
    };

    return (
        <div className="space-y-4">
            <div>
                <label className="text-xs font-medium text-muted-foreground">Conditions</label>
                <div className="mt-2 space-y-2">
                    {conditions.map((condition, i) => (
                        <div key={i} className="rounded-lg bg-muted p-3 space-y-2">
                            <div className="flex items-center gap-2">
                                <input
                                    type="text"
                                    value={condition.variable}
                                    onChange={(e) => updateCondition(i, 'variable', e.target.value)}
                                    placeholder="variable"
                                    className="flex-1 rounded bg-background px-2 py-1 text-sm outline-none"
                                />
                                <select
                                    value={condition.operator}
                                    onChange={(e) => updateCondition(i, 'operator', e.target.value)}
                                    className="rounded bg-background px-2 py-1 text-sm outline-none"
                                >
                                    <option value="eq">=</option>
                                    <option value="neq">≠</option>
                                    <option value="gt">&gt;</option>
                                    <option value="gte">≥</option>
                                    <option value="lt">&lt;</option>
                                    <option value="lte">≤</option>
                                    <option value="contains">contains</option>
                                </select>
                                <input
                                    type="text"
                                    value={condition.value as string}
                                    onChange={(e) => updateCondition(i, 'value', e.target.value)}
                                    placeholder="value"
                                    className="flex-1 rounded bg-background px-2 py-1 text-sm outline-none"
                                />
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6"
                                    onClick={() => removeCondition(i)}
                                >
                                    <X className="h-3 w-3" />
                                </Button>
                            </div>
                        </div>
                    ))}
                    <Button variant="outline" size="sm" className="w-full gap-2" onClick={addCondition}>
                        <Plus className="h-3 w-3" />
                        Add Condition
                    </Button>
                </div>
            </div>
            <div>
                <label className="text-xs font-medium text-muted-foreground">Fallback Node ID</label>
                <input
                    type="text"
                    value={(config.fallbackNodeId as string) || ''}
                    onChange={(e) => onChange('fallbackNodeId', e.target.value)}
                    placeholder="node_id"
                    className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 font-mono text-sm outline-none focus:ring-1 focus:ring-ring"
                />
            </div>
        </div>
    );
}

function EscalateNodeConfig({ config, onChange }: NodeConfigProps) {
    return (
        <div className="space-y-4">
            <div>
                <label className="text-xs font-medium text-muted-foreground">Escalation Reason</label>
                <textarea
                    rows={2}
                    value={(config.reason as string) || ''}
                    onChange={(e) => onChange('reason', e.target.value)}
                    placeholder="Reason for handoff..."
                    className="mt-1 w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-ring"
                />
            </div>
            <div>
                <label className="text-xs font-medium text-muted-foreground">Queue / Skill</label>
                <input
                    type="text"
                    value={(config.queue as string) || ''}
                    onChange={(e) => onChange('queue', e.target.value)}
                    placeholder="support_queue"
                    className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-ring"
                />
            </div>
            <div>
                <label className="text-xs font-medium text-muted-foreground">Include Transcript</label>
                <label className="mt-2 flex cursor-pointer items-center gap-2">
                    <input
                        type="checkbox"
                        checked={(config.includeTranscript as boolean) !== false}
                        onChange={(e) => onChange('includeTranscript', e.target.checked)}
                        className="rounded border-input"
                    />
                    <span className="text-sm">Pass conversation history to agent</span>
                </label>
            </div>
        </div>
    );
}

function EndNodeConfig({ config, onChange }: NodeConfigProps) {
    return (
        <div className="space-y-4">
            <div>
                <label className="text-xs font-medium text-muted-foreground">Goodbye Message</label>
                <textarea
                    rows={2}
                    value={(config.message as string) || ''}
                    onChange={(e) => onChange('message', e.target.value)}
                    placeholder="Thank you for contacting us. Goodbye!"
                    className="mt-1 w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-ring"
                />
            </div>
            <div>
                <label className="text-xs font-medium text-muted-foreground">End Status</label>
                <select
                    value={(config.status as string) || 'completed'}
                    onChange={(e) => onChange('status', e.target.value)}
                    className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-ring"
                >
                    <option value="completed">Completed</option>
                    <option value="abandoned">Abandoned</option>
                    <option value="escalated">Escalated</option>
                    <option value="error">Error</option>
                </select>
            </div>
        </div>
    );
}
