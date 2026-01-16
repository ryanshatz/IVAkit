'use client';

import {
    Play,
    MessageSquare,
    Keyboard,
    Brain,
    Database,
    Wrench,
    GitBranch,
    PhoneForwarded,
    Flag,
    Search,
    GripVertical
} from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

const nodeCategories = [
    {
        name: 'Flow Control',
        nodes: [
            { type: 'start', label: 'Start', icon: Play, color: 'text-emerald-500', description: 'Entry point of the flow' },
            { type: 'end', label: 'End', icon: Flag, color: 'text-gray-500', description: 'Terminates the conversation' },
            { type: 'condition', label: 'Condition', icon: GitBranch, color: 'text-orange-500', description: 'If/else branching logic' },
        ],
    },
    {
        name: 'Communication',
        nodes: [
            { type: 'message', label: 'Message', icon: MessageSquare, color: 'text-blue-500', description: 'Send a static or templated message' },
            { type: 'collect_input', label: 'Collect Input', icon: Keyboard, color: 'text-violet-500', description: 'Wait for user input with validation' },
            { type: 'escalate', label: 'Escalate', icon: PhoneForwarded, color: 'text-red-500', description: 'Hand off to human agent' },
        ],
    },
    {
        name: 'AI & Intelligence',
        nodes: [
            { type: 'llm_router', label: 'LLM Router', icon: Brain, color: 'text-amber-500', description: 'AI-powered intent classification' },
            { type: 'knowledge_search', label: 'Knowledge Search', icon: Database, color: 'text-cyan-500', description: 'RAG retrieval from knowledge base' },
        ],
    },
    {
        name: 'Integrations',
        nodes: [
            { type: 'tool_call', label: 'Tool Call', icon: Wrench, color: 'text-pink-500', description: 'HTTP/webhook external calls' },
        ],
    },
];

export function NodePalette() {
    const onDragStart = (event: React.DragEvent, nodeType: string) => {
        event.dataTransfer.setData('application/reactflow', nodeType);
        event.dataTransfer.effectAllowed = 'move';
    };

    return (
        <div className="flex h-full flex-col">
            {/* Header */}
            <div className="border-b border-border p-4">
                <h2 className="text-sm font-semibold">Node Palette</h2>
                <p className="mt-1 text-xs text-muted-foreground">
                    Drag nodes onto the canvas
                </p>
            </div>

            {/* Search */}
            <div className="border-b border-border p-3">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <input
                        type="text"
                        placeholder="Search nodes..."
                        className="w-full rounded-md border border-input bg-background py-2 pl-9 pr-3 text-sm outline-none focus:ring-1 focus:ring-ring"
                    />
                </div>
            </div>

            {/* Node Categories */}
            <div className="flex-1 overflow-y-auto p-3">
                {nodeCategories.map((category, catIndex) => (
                    <motion.div
                        key={category.name}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: catIndex * 0.1 }}
                        className="mb-4"
                    >
                        <h3 className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                            {category.name}
                        </h3>
                        <div className="space-y-2">
                            {category.nodes.map((node, nodeIndex) => {
                                const Icon = node.icon;
                                return (
                                    <motion.div
                                        key={node.type}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: catIndex * 0.1 + nodeIndex * 0.05 }}
                                        draggable
                                        onDragStart={(e) => onDragStart(e, node.type)}
                                        className={cn(
                                            'group flex cursor-grab items-center gap-3 rounded-lg border border-border bg-card p-3',
                                            'transition-all hover:border-primary/50 hover:bg-accent hover:shadow-md',
                                            'active:cursor-grabbing active:shadow-lg'
                                        )}
                                    >
                                        <GripVertical className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                                        <div className={cn(
                                            'flex h-8 w-8 shrink-0 items-center justify-center rounded-md',
                                            'bg-muted group-hover:bg-background transition-colors',
                                            node.color
                                        )}>
                                            <Icon className="h-4 w-4" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium">{node.label}</p>
                                            <p className="text-xs text-muted-foreground truncate">
                                                {node.description}
                                            </p>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Keyboard Shortcuts */}
            <div className="border-t border-border p-3">
                <p className="text-xs text-muted-foreground">
                    <span className="kbd">⌘</span> + <span className="kbd">D</span> to duplicate
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                    <span className="kbd">Del</span> to remove selected
                </p>
            </div>
        </div>
    );
}
