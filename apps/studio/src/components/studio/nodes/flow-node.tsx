'use client';

import { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { motion } from 'framer-motion';
import {
    Play,
    MessageSquare,
    Keyboard,
    Brain,
    Database,
    Wrench,
    GitBranch,
    PhoneForwarded,
    Flag
} from 'lucide-react';
import { cn } from '@/lib/utils';

const nodeConfig: Record<string, {
    icon: React.ReactNode;
    color: string;
    borderColor: string;
    label: string;
}> = {
    start: {
        icon: <Play className="h-4 w-4" />,
        color: 'bg-emerald-500/20',
        borderColor: 'border-emerald-500',
        label: 'Start',
    },
    message: {
        icon: <MessageSquare className="h-4 w-4" />,
        color: 'bg-blue-500/20',
        borderColor: 'border-blue-500',
        label: 'Message',
    },
    collect_input: {
        icon: <Keyboard className="h-4 w-4" />,
        color: 'bg-violet-500/20',
        borderColor: 'border-violet-500',
        label: 'Collect Input',
    },
    llm_router: {
        icon: <Brain className="h-4 w-4" />,
        color: 'bg-amber-500/20',
        borderColor: 'border-amber-500',
        label: 'LLM Router',
    },
    knowledge_search: {
        icon: <Database className="h-4 w-4" />,
        color: 'bg-cyan-500/20',
        borderColor: 'border-cyan-500',
        label: 'Knowledge Search',
    },
    tool_call: {
        icon: <Wrench className="h-4 w-4" />,
        color: 'bg-pink-500/20',
        borderColor: 'border-pink-500',
        label: 'Tool Call',
    },
    condition: {
        icon: <GitBranch className="h-4 w-4" />,
        color: 'bg-orange-500/20',
        borderColor: 'border-orange-500',
        label: 'Condition',
    },
    escalate: {
        icon: <PhoneForwarded className="h-4 w-4" />,
        color: 'bg-red-500/20',
        borderColor: 'border-red-500',
        label: 'Escalate',
    },
    end: {
        icon: <Flag className="h-4 w-4" />,
        color: 'bg-gray-500/20',
        borderColor: 'border-gray-500',
        label: 'End',
    },
};

interface FlowNodeData {
    type: string;
    name: string;
    config: Record<string, unknown>;
    executing?: boolean;
    error?: boolean;
}

function FlowNodeComponent({ data, selected }: NodeProps<FlowNodeData>) {
    const config = nodeConfig[data.type] || nodeConfig.end;

    return (
        <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.2 }}
            className={cn(
                'flow-node relative min-w-[180px] rounded-lg border-2 bg-card shadow-lg transition-all',
                config.borderColor,
                selected && 'ring-2 ring-primary ring-offset-2 ring-offset-background',
                data.executing && 'animate-pulse-glow',
                data.error && 'border-red-500 bg-red-500/10'
            )}
        >
            {/* Handles */}
            {data.type !== 'start' && (
                <Handle
                    type="target"
                    position={Position.Top}
                    className="!h-3 !w-3 !border-2 !border-background !bg-muted-foreground"
                />
            )}

            {data.type !== 'end' && (
                <Handle
                    type="source"
                    position={Position.Bottom}
                    className="!h-3 !w-3 !border-2 !border-background !bg-muted-foreground"
                />
            )}

            {/* Multiple outputs for router/condition */}
            {(data.type === 'llm_router' || data.type === 'condition') && (
                <>
                    <Handle
                        type="source"
                        position={Position.Right}
                        id="right"
                        className="!h-3 !w-3 !border-2 !border-background !bg-muted-foreground"
                    />
                    <Handle
                        type="source"
                        position={Position.Left}
                        id="left"
                        className="!h-3 !w-3 !border-2 !border-background !bg-muted-foreground"
                    />
                </>
            )}

            {/* Node Content */}
            <div className="px-4 py-3">
                <div className="flex items-center gap-2">
                    <div className={cn(
                        'flex h-7 w-7 items-center justify-center rounded-md',
                        config.color
                    )}>
                        {config.icon}
                    </div>
                    <div className="flex flex-col">
                        <span className="text-xs font-medium text-muted-foreground">
                            {config.label}
                        </span>
                        <span className="text-sm font-semibold leading-tight">
                            {data.name}
                        </span>
                    </div>
                </div>

                {/* Preview of config */}
                {data.type === 'message' && data.config.message && (
                    <div className="mt-2 rounded bg-muted/50 px-2 py-1">
                        <p className="line-clamp-2 text-xs text-muted-foreground">
                            {data.config.message as string}
                        </p>
                    </div>
                )}

                {data.type === 'collect_input' && data.config.variableName && (
                    <div className="mt-2 flex items-center gap-1">
                        <span className="rounded bg-violet-500/20 px-1.5 py-0.5 font-mono text-xs text-violet-400">
                            ${`{${data.config.variableName}}`}
                        </span>
                    </div>
                )}

                {data.type === 'llm_router' && (
                    <div className="mt-2 flex flex-wrap gap-1">
                        {((data.config.intents as Array<{ name: string }>) || []).slice(0, 3).map((intent, i) => (
                            <span
                                key={i}
                                className="rounded bg-amber-500/20 px-1.5 py-0.5 text-xs text-amber-400"
                            >
                                {intent.name}
                            </span>
                        ))}
                    </div>
                )}

                {data.type === 'knowledge_search' && data.config.knowledgeBaseId && (
                    <div className="mt-2">
                        <span className="rounded bg-cyan-500/20 px-1.5 py-0.5 font-mono text-xs text-cyan-400">
                            📚 {data.config.knowledgeBaseId as string}
                        </span>
                    </div>
                )}

                {data.type === 'tool_call' && data.config.toolId && (
                    <div className="mt-2">
                        <span className="rounded bg-pink-500/20 px-1.5 py-0.5 font-mono text-xs text-pink-400">
                            🔧 {data.config.toolId as string}
                        </span>
                    </div>
                )}

                {data.type === 'escalate' && data.config.reason && (
                    <div className="mt-2 rounded bg-red-500/10 px-2 py-1">
                        <p className="line-clamp-1 text-xs text-red-400">
                            {data.config.reason as string}
                        </p>
                    </div>
                )}
            </div>

            {/* Status indicator */}
            {data.executing && (
                <div className="absolute -right-1 -top-1 h-3 w-3 rounded-full bg-blue-500 animate-ping" />
            )}
            {data.error && (
                <div className="absolute -right-1 -top-1 h-3 w-3 rounded-full bg-red-500" />
            )}
        </motion.div>
    );
}

export const FlowNode = memo(FlowNodeComponent);
