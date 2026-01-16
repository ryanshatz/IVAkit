'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X,
    Send,
    RotateCcw,
    Play,
    Pause,
    Code,
    Terminal,
    Clock,
    Zap,
    ChevronDown,
    ChevronUp,
    Brain,
    MessageSquare,
    User,
    Bot,
    FileText,
    GitBranch,
    Phone,
    Search,
    Wrench,
    Square,
} from 'lucide-react';
import { useAtomValue } from 'jotai';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { flowStateAtom, FlowNodeData } from '@/store/flow-store';
import { Node, Edge } from 'reactflow';

interface SimulatorPanelProps {
    onClose: () => void;
}

interface Message {
    id: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp: Date;
    nodeId?: string;
    nodeType?: string;
    metadata?: {
        tokens?: number;
        latency?: number;
        intent?: string;
        confidence?: number;
    };
}

interface ExecutionStep {
    id: string;
    nodeId: string;
    nodeType: string;
    nodeName: string;
    status: 'pending' | 'running' | 'completed' | 'error';
    input?: Record<string, unknown>;
    output?: Record<string, unknown>;
    duration?: number;
    timestamp: Date;
}

interface SessionVariables {
    [key: string]: unknown;
}

export function SimulatorPanel({ onClose }: SimulatorPanelProps) {
    const flowState = useAtomValue(flowStateAtom);

    const [messages, setMessages] = useState<Message[]>([]);
    const [steps, setSteps] = useState<ExecutionStep[]>([]);
    const [input, setInput] = useState('');
    const [isRunning, setIsRunning] = useState(false);
    const [showDebug, setShowDebug] = useState(false);
    const [expandedSteps, setExpandedSteps] = useState<string[]>([]);
    const [variables, setVariables] = useState<SessionVariables>({});
    const [currentNodeId, setCurrentNodeId] = useState<string | null>(null);
    const [waitingForInput, setWaitingForInput] = useState(false);
    const [totalTokens, setTotalTokens] = useState(0);
    const [totalLatency, setTotalLatency] = useState(0);
    const [hasStarted, setHasStarted] = useState(false);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const variablesRef = useRef<SessionVariables>({});

    // Keep ref in sync with state
    useEffect(() => {
        variablesRef.current = variables;
    }, [variables]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Find node by ID
    const findNode = useCallback((nodeId: string): Node<FlowNodeData> | undefined => {
        return flowState.nodes.find(n => n.id === nodeId);
    }, [flowState.nodes]);

    // Find edges from a node
    const findEdgesFrom = useCallback((nodeId: string): Edge[] => {
        return flowState.edges.filter(e => e.source === nodeId);
    }, [flowState.edges]);

    // Interpolate variables in text
    const interpolate = useCallback((text: string): string => {
        return text.replace(/\{\{(\w+)\}\}/g, (match, varName) => {
            return String(variablesRef.current[varName] ?? match);
        });
    }, []);

    // Simulate LLM intent classification
    const classifyIntent = useCallback(async (message: string, intents: { name: string; description: string }[]): Promise<{ intent: string; confidence: number }> => {
        // Simulate AI call latency
        await new Promise(resolve => setTimeout(resolve, 300 + Math.random() * 500));

        // Simple keyword-based matching for demo
        const lowerMessage = message.toLowerCase();

        for (const intent of intents) {
            const keywords = intent.name.split('_').map(w => w.toLowerCase());
            const descWords = intent.description.toLowerCase().split(' ');

            const matchScore = [...keywords, ...descWords].reduce((score, word) => {
                if (lowerMessage.includes(word) && word.length > 2) {
                    return score + (1 / (keywords.length + descWords.length));
                }
                return score;
            }, 0);

            if (matchScore > 0.2) {
                return {
                    intent: intent.name,
                    confidence: Math.min(0.95, 0.7 + matchScore),
                };
            }
        }

        // Return first intent with lower confidence if no match
        return {
            intent: intents[0]?.name || 'unknown',
            confidence: 0.4 + Math.random() * 0.2,
        };
    }, []);

    // Execute the flow from a starting node
    const executeFlow = useCallback(async (startNodeId: string, userMessage?: string) => {
        setIsRunning(true);
        let currentId: string | null = startNodeId;
        let localVars = { ...variablesRef.current };

        if (userMessage) {
            localVars.user_message = userMessage;
            localVars.last_input = userMessage;
            setVariables(localVars);
            variablesRef.current = localVars;
        }

        while (currentId) {
            const node = findNode(currentId);
            if (!node) {
                console.error(`Node ${currentId} not found`);
                break;
            }

            setCurrentNodeId(currentId);
            const startTime = Date.now();

            const stepId = `step_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            const newStep: ExecutionStep = {
                id: stepId,
                nodeId: currentId,
                nodeType: node.data.type,
                nodeName: node.data.name,
                status: 'running',
                input: userMessage ? { message: userMessage } : undefined,
                timestamp: new Date(),
            };
            setSteps(prev => [...prev, newStep]);

            // Simulate node execution delay
            await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 200));

            const config = node.data.config;
            let nextNodeId: string | null = null;

            switch (node.data.type) {
                case 'start': {
                    const welcomeMsg = interpolate(String(config.welcomeMessage || 'Hello! How can I help you today?'));
                    const msgId = `msg_${Date.now()}`;
                    setMessages(prev => [...prev, {
                        id: msgId,
                        role: 'assistant',
                        content: welcomeMsg,
                        nodeId: currentId!,
                        nodeType: node.data.type,
                        timestamp: new Date(),
                    }]);

                    setSteps(prev => prev.map(s => s.id === stepId ? {
                        ...s,
                        status: 'completed',
                        duration: Date.now() - startTime,
                        output: { message: welcomeMsg },
                    } : s));

                    const edges = findEdgesFrom(currentId);
                    nextNodeId = edges[0]?.target ?? null;
                    break;
                }

                case 'message': {
                    const message = interpolate(String(config.message || ''));
                    const delay = Number(config.delay) || 0;

                    if (delay > 0) {
                        await new Promise(resolve => setTimeout(resolve, delay));
                    }

                    const latency = Date.now() - startTime;
                    setMessages(prev => [...prev, {
                        id: `msg_${Date.now()}`,
                        role: 'assistant',
                        content: message,
                        nodeId: currentId!,
                        nodeType: node.data.type,
                        metadata: { latency },
                        timestamp: new Date(),
                    }]);
                    setTotalLatency(prev => prev + latency);

                    setSteps(prev => prev.map(s => s.id === stepId ? {
                        ...s,
                        status: 'completed',
                        duration: latency,
                        output: { message },
                    } : s));

                    const edges = findEdgesFrom(currentId);
                    nextNodeId = edges[0]?.target ?? null;
                    break;
                }

                case 'collect_input': {
                    const prompt = config.prompt ? interpolate(String(config.prompt)) : '';

                    if (prompt) {
                        setMessages(prev => [...prev, {
                            id: `msg_${Date.now()}`,
                            role: 'assistant',
                            content: prompt,
                            nodeId: currentId!,
                            nodeType: node.data.type,
                            timestamp: new Date(),
                        }]);
                    }

                    setSteps(prev => prev.map(s => s.id === stepId ? {
                        ...s,
                        status: 'completed',
                        duration: Date.now() - startTime,
                        output: { waitingForInput: true, variableName: config.variableName },
                    } : s));

                    // Wait for user input
                    setWaitingForInput(true);
                    setCurrentNodeId(currentId);
                    setIsRunning(false);
                    return; // Will continue after user input
                }

                case 'llm_router': {
                    const intents = (config.intents as Array<{ name: string; description: string; targetNodeId: string }>) || [];
                    const userMsg = String(localVars.user_message || userMessage || '');

                    const result = await classifyIntent(userMsg, intents);

                    localVars.detected_intent = result.intent;
                    localVars.intent_confidence = result.confidence;
                    setVariables(localVars);
                    variablesRef.current = localVars;

                    const tokens = 25 + Math.floor(Math.random() * 20);
                    const latency = Date.now() - startTime;

                    setMessages(prev => [...prev, {
                        id: `msg_${Date.now()}`,
                        role: 'system',
                        content: `🧠 Intent: ${result.intent} (${(result.confidence * 100).toFixed(0)}% confidence)`,
                        nodeId: currentId!,
                        nodeType: node.data.type,
                        metadata: {
                            intent: result.intent,
                            confidence: result.confidence,
                            tokens,
                            latency,
                        },
                        timestamp: new Date(),
                    }]);
                    setTotalTokens(prev => prev + tokens);
                    setTotalLatency(prev => prev + latency);

                    setSteps(prev => prev.map(s => s.id === stepId ? {
                        ...s,
                        status: 'completed',
                        duration: latency,
                        input: { message: userMsg, intents: intents.map(i => i.name) },
                        output: result,
                    } : s));
                    setExpandedSteps(prev => [...prev, stepId]);

                    // Find matching intent's target node
                    const matchedIntent = intents.find(i => i.name === result.intent);
                    if (matchedIntent?.targetNodeId) {
                        nextNodeId = matchedIntent.targetNodeId;
                    } else {
                        const edges = findEdgesFrom(currentId);
                        nextNodeId = edges[0]?.target ?? null;
                    }
                    break;
                }

                case 'knowledge_search': {
                    const query = interpolate(String(config.query || ''));

                    // Simulate knowledge search
                    await new Promise(resolve => setTimeout(resolve, 200 + Math.random() * 300));

                    const mockResults = [
                        { content: 'Based on our FAQ, you can track your order status by visiting our website and logging into your account.', score: 0.85 },
                        { content: 'Order tracking is available 24/7 through your account dashboard or by contacting support.', score: 0.78 },
                    ];

                    localVars.faq_answer = mockResults[0].content;
                    localVars.faq_confidence = mockResults[0].score;
                    localVars.search_results = mockResults;
                    setVariables(localVars);
                    variablesRef.current = localVars;

                    setSteps(prev => prev.map(s => s.id === stepId ? {
                        ...s,
                        status: 'completed',
                        duration: Date.now() - startTime,
                        input: { query },
                        output: { results: mockResults },
                    } : s));

                    const edges = findEdgesFrom(currentId);
                    nextNodeId = edges[0]?.target ?? null;
                    break;
                }

                case 'tool_call': {
                    const toolId = String(config.toolId || '');

                    // Simulate tool call
                    await new Promise(resolve => setTimeout(resolve, 300 + Math.random() * 400));

                    const mockResult = { status: 'success', data: { systemStatus: 'operational', timestamp: new Date().toISOString() } };

                    const outputVar = String(config.outputVariable || 'tool_result');
                    localVars[outputVar] = mockResult;
                    setVariables(localVars);
                    variablesRef.current = localVars;

                    setSteps(prev => prev.map(s => s.id === stepId ? {
                        ...s,
                        status: 'completed',
                        duration: Date.now() - startTime,
                        input: { toolId, inputs: config.inputs as Record<string, unknown> || {} },
                        output: mockResult,
                    } : s));

                    const edges = findEdgesFrom(currentId);
                    nextNodeId = edges[0]?.target ?? null;
                    break;
                }

                case 'condition': {
                    const conditions = (config.conditions as Array<{ variable: string; operator: string; value: unknown; targetNodeId: string }>) || [];
                    let matched = false;

                    for (const cond of conditions) {
                        const varValue = localVars[cond.variable];
                        let result = false;

                        switch (cond.operator) {
                            case 'eq': result = varValue === cond.value; break;
                            case 'neq': result = varValue !== cond.value; break;
                            case 'gt': result = Number(varValue) > Number(cond.value); break;
                            case 'gte': result = Number(varValue) >= Number(cond.value); break;
                            case 'lt': result = Number(varValue) < Number(cond.value); break;
                            case 'lte': result = Number(varValue) <= Number(cond.value); break;
                            case 'contains': result = String(varValue).includes(String(cond.value)); break;
                        }

                        if (result) {
                            nextNodeId = cond.targetNodeId;
                            matched = true;
                            break;
                        }
                    }

                    if (!matched && config.fallbackNodeId) {
                        nextNodeId = String(config.fallbackNodeId);
                    }

                    setSteps(prev => prev.map(s => s.id === stepId ? {
                        ...s,
                        status: 'completed',
                        duration: Date.now() - startTime,
                        input: { conditions: conditions.map(c => `${c.variable} ${c.operator} ${c.value}`) },
                        output: { matched, nextNodeId },
                    } : s));
                    break;
                }

                case 'escalate': {
                    const reason = interpolate(String(config.reason || ''));
                    const queue = String(config.queue || 'default');

                    setMessages(prev => [...prev, {
                        id: `msg_${Date.now()}`,
                        role: 'system',
                        content: `🔄 Escalating to human agent (${queue}): ${reason}`,
                        nodeId: currentId!,
                        nodeType: node.data.type,
                        timestamp: new Date(),
                    }]);

                    setSteps(prev => prev.map(s => s.id === stepId ? {
                        ...s,
                        status: 'completed',
                        duration: Date.now() - startTime,
                        output: { escalated: true, queue, reason },
                    } : s));

                    const edges = findEdgesFrom(currentId);
                    nextNodeId = edges[0]?.target ?? null;
                    break;
                }

                case 'end': {
                    const message = interpolate(String(config.message || 'Goodbye!'));

                    setMessages(prev => [...prev, {
                        id: `msg_${Date.now()}`,
                        role: 'assistant',
                        content: message,
                        nodeId: currentId!,
                        nodeType: node.data.type,
                        timestamp: new Date(),
                    }]);

                    setSteps(prev => prev.map(s => s.id === stepId ? {
                        ...s,
                        status: 'completed',
                        duration: Date.now() - startTime,
                        output: { status: config.status || 'completed' },
                    } : s));

                    setIsRunning(false);
                    setCurrentNodeId(null);
                    nextNodeId = null;
                    break;
                }

                default:
                    setSteps(prev => prev.map(s => s.id === stepId ? {
                        ...s,
                        status: 'error',
                        duration: Date.now() - startTime,
                        output: { error: `Unknown node type: ${node.data.type}` },
                    } : s));
            }

            currentId = nextNodeId;
        }

        setIsRunning(false);
    }, [findNode, findEdgesFrom, interpolate, classifyIntent]);

    // Start the simulation
    const startSimulation = useCallback(async () => {
        // Find start node
        const startNode = flowState.nodes.find(n => n.data.type === 'start');
        if (!startNode) {
            setMessages([{
                id: `msg_${Date.now()}`,
                role: 'system',
                content: '❌ Error: No Start node found in flow',
                timestamp: new Date(),
            }]);
            return;
        }

        setHasStarted(true);
        await executeFlow(startNode.id);
    }, [flowState.nodes, executeFlow]);

    // Handle user sending a message
    const handleSend = useCallback(async () => {
        if (!input.trim()) return;

        const userMessage = input.trim();
        setInput('');

        // Add user message
        setMessages(prev => [...prev, {
            id: `msg_${Date.now()}`,
            role: 'user',
            content: userMessage,
            timestamp: new Date(),
        }]);

        if (waitingForInput && currentNodeId) {
            // Continue from collect_input node
            setWaitingForInput(false);

            const node = findNode(currentNodeId);
            if (node) {
                const varName = String(node.data.config.variableName || 'user_input');
                const newVars = { ...variablesRef.current, [varName]: userMessage, user_message: userMessage };
                setVariables(newVars);
                variablesRef.current = newVars;
            }

            // Continue execution from next node
            const edges = findEdgesFrom(currentNodeId);
            const nextId = edges[0]?.target;

            if (nextId) {
                await executeFlow(nextId, userMessage);
            }
        } else if (!hasStarted) {
            // Start fresh simulation
            await startSimulation();
        }
    }, [input, waitingForInput, currentNodeId, findNode, findEdgesFrom, executeFlow, hasStarted, startSimulation]);

    // Reset simulation
    const resetSimulation = useCallback(() => {
        setMessages([]);
        setSteps([]);
        setVariables({});
        variablesRef.current = {};
        setCurrentNodeId(null);
        setWaitingForInput(false);
        setIsRunning(false);
        setTotalTokens(0);
        setTotalLatency(0);
        setExpandedSteps([]);
        setHasStarted(false);
    }, []);

    // Auto-start on first render
    useEffect(() => {
        if (!hasStarted && flowState.nodes.length > 0) {
            startSimulation();
        }
    }, [hasStarted, flowState.nodes.length, startSimulation]);

    const toggleStep = (stepId: string) => {
        setExpandedSteps(prev =>
            prev.includes(stepId)
                ? prev.filter(id => id !== stepId)
                : [...prev, stepId]
        );
    };

    return (
        <div className="flex h-full flex-col">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border p-4">
                <div className="flex items-center gap-2">
                    <div className={cn(
                        "h-2 w-2 rounded-full",
                        isRunning ? "bg-green-500 animate-pulse" : waitingForInput ? "bg-amber-500 animate-pulse" : "bg-gray-500"
                    )} />
                    <h2 className="text-sm font-semibold">Conversation Simulator</h2>
                    {waitingForInput && (
                        <span className="text-xs text-amber-500">(waiting for input)</span>
                    )}
                </div>
                <div className="flex items-center gap-1">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={resetSimulation}
                        title="Reset"
                    >
                        <RotateCcw className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose}>
                        <X className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {/* Toggle Debug */}
            <div className="flex border-b border-border">
                <button
                    onClick={() => setShowDebug(false)}
                    className={cn(
                        "flex-1 py-2 text-xs font-medium transition-colors",
                        !showDebug ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground"
                    )}
                >
                    <MessageSquare className="inline-block h-3 w-3 mr-1" />
                    Chat
                </button>
                <button
                    onClick={() => setShowDebug(true)}
                    className={cn(
                        "flex-1 py-2 text-xs font-medium transition-colors",
                        showDebug ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground"
                    )}
                >
                    <Terminal className="inline-block h-3 w-3 mr-1" />
                    Debug ({steps.length})
                </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-hidden">
                {showDebug ? (
                    <DebugView
                        steps={steps}
                        expandedSteps={expandedSteps}
                        onToggleStep={toggleStep}
                        variables={variables}
                    />
                ) : (
                    <ChatView messages={messages} messagesEndRef={messagesEndRef} />
                )}
            </div>

            {/* Stats Bar */}
            <div className="flex items-center gap-4 border-t border-border px-4 py-2 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                    <MessageSquare className="h-3 w-3" />
                    <span>{messages.length} messages</span>
                </div>
                <div className="flex items-center gap-1">
                    <Zap className="h-3 w-3" />
                    <span>{totalTokens} tokens</span>
                </div>
                <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    <span>{totalLatency}ms</span>
                </div>
            </div>

            {/* Input */}
            <div className="border-t border-border p-4">
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                        placeholder={waitingForInput ? "Type your response..." : "Type a message..."}
                        className="flex-1 rounded-lg border border-input bg-background px-4 py-2 text-sm outline-none focus:ring-1 focus:ring-ring"
                    />
                    <Button size="icon" onClick={handleSend}>
                        <Send className="h-4 w-4" />
                    </Button>
                </div>
            </div>
        </div>
    );
}

function ChatView({
    messages,
    messagesEndRef
}: {
    messages: Message[];
    messagesEndRef: React.RefObject<HTMLDivElement | null>;
}) {
    return (
        <div className="h-full overflow-y-auto p-4 space-y-4">
            {messages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
                    <Bot className="h-12 w-12 mb-4 opacity-50" />
                    <p className="text-sm">Starting simulation...</p>
                </div>
            )}
            {messages.map((message) => (
                <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={cn(
                        "flex gap-3",
                        message.role === 'user' ? "justify-end" : "justify-start"
                    )}
                >
                    {message.role === 'assistant' && (
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/20">
                            <Bot className="h-4 w-4 text-primary" />
                        </div>
                    )}
                    {message.role === 'system' && (
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-500/20">
                            <Brain className="h-4 w-4 text-amber-500" />
                        </div>
                    )}
                    <div className={cn(
                        "max-w-[80%] rounded-lg px-4 py-2",
                        message.role === 'user'
                            ? "bg-primary text-primary-foreground"
                            : message.role === 'system'
                                ? "bg-amber-500/10 border border-amber-500/30"
                                : "bg-muted"
                    )}>
                        <p className="text-sm">{message.content}</p>
                        {message.metadata && (
                            <div className="mt-2 flex flex-wrap gap-2 text-xs opacity-70">
                                {message.metadata.intent && (
                                    <span className="rounded bg-black/20 px-1.5 py-0.5">
                                        intent: {message.metadata.intent}
                                    </span>
                                )}
                                {message.metadata.confidence !== undefined && (
                                    <span className="rounded bg-black/20 px-1.5 py-0.5">
                                        {(message.metadata.confidence * 100).toFixed(0)}% conf
                                    </span>
                                )}
                                {message.metadata.latency !== undefined && (
                                    <span className="rounded bg-black/20 px-1.5 py-0.5">
                                        {message.metadata.latency}ms
                                    </span>
                                )}
                            </div>
                        )}
                    </div>
                    {message.role === 'user' && (
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary">
                            <User className="h-4 w-4" />
                        </div>
                    )}
                </motion.div>
            ))}
            <div ref={messagesEndRef} />
        </div>
    );
}

function DebugView({
    steps,
    expandedSteps,
    onToggleStep,
    variables,
}: {
    steps: ExecutionStep[];
    expandedSteps: string[];
    onToggleStep: (id: string) => void;
    variables: SessionVariables;
}) {
    const getStatusColor = (status: ExecutionStep['status']) => {
        switch (status) {
            case 'completed': return 'bg-green-500';
            case 'running': return 'bg-blue-500 animate-pulse';
            case 'error': return 'bg-red-500';
            default: return 'bg-gray-500';
        }
    };

    const getNodeTypeIcon = (type: string) => {
        switch (type) {
            case 'start': return <Play className="h-3 w-3" />;
            case 'end': return <Square className="h-3 w-3" />;
            case 'llm_router': return <Brain className="h-3 w-3" />;
            case 'message': return <MessageSquare className="h-3 w-3" />;
            case 'collect_input': return <FileText className="h-3 w-3" />;
            case 'condition': return <GitBranch className="h-3 w-3" />;
            case 'knowledge_search': return <Search className="h-3 w-3" />;
            case 'tool_call': return <Wrench className="h-3 w-3" />;
            case 'escalate': return <Phone className="h-3 w-3" />;
            default: return <Code className="h-3 w-3" />;
        }
    };

    return (
        <div className="h-full overflow-y-auto">
            {/* Variables Section */}
            {Object.keys(variables).length > 0 && (
                <div className="border-b border-border p-4">
                    <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                        Session Variables
                    </h3>
                    <div className="space-y-1 text-xs font-mono">
                        {Object.entries(variables).slice(0, 5).map(([key, value]) => (
                            <div key={key} className="flex justify-between gap-2">
                                <span className="text-muted-foreground">{key}:</span>
                                <span className="truncate max-w-[150px]">
                                    {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                                </span>
                            </div>
                        ))}
                        {Object.keys(variables).length > 5 && (
                            <div className="text-muted-foreground">
                                +{Object.keys(variables).length - 5} more...
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Execution Steps */}
            <div className="p-4 space-y-2">
                <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
                    Execution Steps ({steps.length})
                </h3>
                {steps.length === 0 && (
                    <p className="text-sm text-muted-foreground">No steps executed yet</p>
                )}
                {steps.map((step, index) => {
                    const isExpanded = expandedSteps.includes(step.id);
                    return (
                        <motion.div
                            key={step.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.02 }}
                            className="relative"
                        >
                            {/* Connection line */}
                            {index < steps.length - 1 && (
                                <div className="absolute left-[11px] top-6 h-full w-0.5 bg-border" />
                            )}

                            <button
                                onClick={() => onToggleStep(step.id)}
                                className={cn(
                                    "w-full rounded-lg border border-border bg-card p-3 text-left transition-all hover:bg-accent",
                                    isExpanded && "ring-1 ring-primary"
                                )}
                            >
                                <div className="flex items-center gap-3">
                                    <div className={cn("h-[22px] w-[22px] rounded-full flex items-center justify-center", getStatusColor(step.status))}>
                                        {step.status === 'completed' && <span className="text-white text-xs">✓</span>}
                                        {step.status === 'running' && <span className="text-white text-xs">•</span>}
                                        {step.status === 'error' && <span className="text-white text-xs">!</span>}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-medium">{step.nodeName}</span>
                                            <span className="rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground flex items-center gap-1">
                                                {getNodeTypeIcon(step.nodeType)}
                                                {step.nodeType}
                                            </span>
                                        </div>
                                        {step.duration && (
                                            <span className="text-xs text-muted-foreground">{step.duration}ms</span>
                                        )}
                                    </div>
                                    {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                </div>

                                <AnimatePresence>
                                    {isExpanded && (step.input || step.output) && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            className="overflow-hidden"
                                        >
                                            <div className="mt-3 space-y-2 border-t border-border pt-3">
                                                {step.input && (
                                                    <div>
                                                        <p className="text-xs font-medium text-muted-foreground mb-1">Input</p>
                                                        <pre className="rounded bg-muted p-2 text-xs overflow-auto max-h-32">
                                                            {JSON.stringify(step.input, null, 2)}
                                                        </pre>
                                                    </div>
                                                )}
                                                {step.output && (
                                                    <div>
                                                        <p className="text-xs font-medium text-muted-foreground mb-1">Output</p>
                                                        <pre className="rounded bg-muted p-2 text-xs overflow-auto max-h-32">
                                                            {JSON.stringify(step.output, null, 2)}
                                                        </pre>
                                                    </div>
                                                )}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </button>
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
}
