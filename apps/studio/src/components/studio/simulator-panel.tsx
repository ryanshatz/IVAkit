'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X,
    Send,
    RotateCcw,
    Play,
    Pause,
    SkipForward,
    Code,
    Terminal,
    Clock,
    Zap,
    ChevronDown,
    ChevronUp,
    Brain,
    MessageSquare,
    User,
    Bot
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

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
    input?: unknown;
    output?: unknown;
    duration?: number;
    timestamp: Date;
}

// Demo messages
const demoMessages: Message[] = [
    {
        id: '1',
        role: 'assistant',
        content: 'Hello! Welcome to Acme Support. How can I help you today?',
        timestamp: new Date(),
        nodeId: 'start_1',
        nodeType: 'start',
    },
    {
        id: '2',
        role: 'user',
        content: 'I want to check the status of my order',
        timestamp: new Date(),
    },
    {
        id: '3',
        role: 'assistant',
        content: "I'd be happy to help you check your order status! Could you please provide your order number?",
        timestamp: new Date(),
        nodeId: 'kb_1',
        nodeType: 'knowledge_search',
        metadata: {
            tokens: 42,
            latency: 320,
            intent: 'order_status',
            confidence: 0.94,
        },
    },
];

const demoSteps: ExecutionStep[] = [
    {
        id: 's1',
        nodeId: 'start_1',
        nodeType: 'start',
        nodeName: 'Start',
        status: 'completed',
        duration: 5,
        timestamp: new Date(),
    },
    {
        id: 's2',
        nodeId: 'collect_1',
        nodeType: 'collect_input',
        nodeName: 'Get Input',
        status: 'completed',
        duration: 2500,
        timestamp: new Date(),
    },
    {
        id: 's3',
        nodeId: 'router_1',
        nodeType: 'llm_router',
        nodeName: 'Intent Router',
        status: 'completed',
        input: { message: 'I want to check the status of my order' },
        output: { intent: 'order_status', confidence: 0.94 },
        duration: 285,
        timestamp: new Date(),
    },
    {
        id: 's4',
        nodeId: 'kb_1',
        nodeType: 'knowledge_search',
        nodeName: 'Search FAQ',
        status: 'running',
        timestamp: new Date(),
    },
];

export function SimulatorPanel({ onClose }: SimulatorPanelProps) {
    const [messages, setMessages] = useState<Message[]>(demoMessages);
    const [steps, setSteps] = useState<ExecutionStep[]>(demoSteps);
    const [input, setInput] = useState('');
    const [isRunning, setIsRunning] = useState(true);
    const [showDebug, setShowDebug] = useState(true);
    const [expandedSteps, setExpandedSteps] = useState<string[]>(['s3']);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = () => {
        if (!input.trim()) return;

        const newMessage: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: input,
            timestamp: new Date(),
        };

        setMessages([...messages, newMessage]);
        setInput('');

        // Simulate response
        setTimeout(() => {
            setMessages(prev => [...prev, {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: 'Thank you for that information. Let me look that up for you...',
                timestamp: new Date(),
                nodeId: 'msg_answer',
                nodeType: 'message',
                metadata: {
                    tokens: 28,
                    latency: 180,
                },
            }]);
        }, 1000);
    };

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
                        isRunning ? "bg-green-500 animate-pulse" : "bg-gray-500"
                    )} />
                    <h2 className="text-sm font-semibold">Conversation Simulator</h2>
                </div>
                <div className="flex items-center gap-1">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setIsRunning(!isRunning)}
                    >
                        {isRunning ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => { setMessages(demoMessages.slice(0, 1)); setSteps(demoSteps.slice(0, 1)); }}
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
                    Debug
                </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-hidden">
                {showDebug ? (
                    <DebugView
                        steps={steps}
                        expandedSteps={expandedSteps}
                        onToggleStep={toggleStep}
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
                    <span>156 tokens</span>
                </div>
                <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    <span>985ms total</span>
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
                        placeholder="Type a message..."
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
    messagesEndRef: React.RefObject<HTMLDivElement>;
}) {
    return (
        <div className="h-full overflow-y-auto p-4 space-y-4">
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
                    {message.role !== 'user' && (
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/20">
                            <Bot className="h-4 w-4 text-primary" />
                        </div>
                    )}
                    <div className={cn(
                        "max-w-[80%] rounded-lg px-4 py-2",
                        message.role === 'user'
                            ? "bg-primary text-primary-foreground"
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
                                {message.metadata.confidence && (
                                    <span className="rounded bg-black/20 px-1.5 py-0.5">
                                        {(message.metadata.confidence * 100).toFixed(0)}% conf
                                    </span>
                                )}
                                {message.metadata.latency && (
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
}: {
    steps: ExecutionStep[];
    expandedSteps: string[];
    onToggleStep: (id: string) => void;
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
            case 'llm_router': return <Brain className="h-3 w-3" />;
            case 'message': return <MessageSquare className="h-3 w-3" />;
            default: return <Code className="h-3 w-3" />;
        }
    };

    return (
        <div className="h-full overflow-y-auto p-4 space-y-2">
            <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
                Execution Steps
            </h3>
            {steps.map((step, index) => {
                const isExpanded = expandedSteps.includes(step.id);
                return (
                    <motion.div
                        key={step.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
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
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-medium">{step.nodeName}</span>
                                        <span className="rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
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
                                                    <pre className="rounded bg-muted p-2 text-xs overflow-auto">
                                                        {JSON.stringify(step.input, null, 2)}
                                                    </pre>
                                                </div>
                                            )}
                                            {step.output && (
                                                <div>
                                                    <p className="text-xs font-medium text-muted-foreground mb-1">Output</p>
                                                    <pre className="rounded bg-muted p-2 text-xs overflow-auto">
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
    );
}
