'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, Keyboard, MousePointer2, Zap, FileJson, MessageSquare } from 'lucide-react';
import { useAtom } from 'jotai';
import { atom } from 'jotai';
import { Button } from '@/components/ui/button';

// Help modal open state
export const helpOpenAtom = atom(false);

export function HelpModal() {
    const [isOpen, setIsOpen] = useAtom(helpOpenAtom);

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
                        onClick={() => setIsOpen(false)}
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        transition={{ type: 'spring', duration: 0.3 }}
                        className="fixed left-1/2 top-1/2 z-50 w-full max-w-2xl -translate-x-1/2 -translate-y-1/2 rounded-xl border border-border bg-card shadow-2xl"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between border-b border-border p-4">
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 via-cyan-500 to-purple-600">
                                    <span className="text-xl font-bold text-white">?</span>
                                </div>
                                <div>
                                    <h2 className="text-lg font-semibold">Help & Shortcuts</h2>
                                    <p className="text-sm text-muted-foreground">Quick reference for IVAkit Studio</p>
                                </div>
                            </div>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => setIsOpen(false)}
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </div>

                        {/* Content */}
                        <div className="max-h-[60vh] overflow-y-auto p-6">
                            {/* Keyboard Shortcuts */}
                            <HelpSection
                                icon={<Keyboard className="h-5 w-5" />}
                                title="Keyboard Shortcuts"
                            >
                                <div className="grid grid-cols-2 gap-4">
                                    <ShortcutGroup title="General">
                                        <Shortcut keys={['Ctrl', 'S']} action="Save flow" />
                                        <Shortcut keys={['Ctrl', 'Z']} action="Undo" />
                                        <Shortcut keys={['Ctrl', 'Shift', 'Z']} action="Redo" />
                                        <Shortcut keys={['?']} action="Show help" />
                                    </ShortcutGroup>
                                    <ShortcutGroup title="Nodes">
                                        <Shortcut keys={['Delete']} action="Delete node" />
                                        <Shortcut keys={['Ctrl', 'D']} action="Duplicate node" />
                                        <Shortcut keys={['Escape']} action="Deselect node" />
                                    </ShortcutGroup>
                                    <ShortcutGroup title="Flow">
                                        <Shortcut keys={['Ctrl', 'E']} action="Export flow" />
                                        <Shortcut keys={['Ctrl', 'I']} action="Import flow" />
                                    </ShortcutGroup>
                                    <ShortcutGroup title="View">
                                        <Shortcut keys={['Ctrl', '+']} action="Zoom in" />
                                        <Shortcut keys={['Ctrl', '-']} action="Zoom out" />
                                        <Shortcut keys={['Ctrl', '0']} action="Fit to view" />
                                    </ShortcutGroup>
                                </div>
                            </HelpSection>

                            {/* Mouse Interactions */}
                            <HelpSection
                                icon={<MousePointer2 className="h-5 w-5" />}
                                title="Mouse Interactions"
                            >
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div className="space-y-2">
                                        <p><strong>Click node</strong> — Select and configure</p>
                                        <p><strong>Drag node</strong> — Move position</p>
                                        <p><strong>Click canvas</strong> — Deselect</p>
                                    </div>
                                    <div className="space-y-2">
                                        <p><strong>Drag handle</strong> — Create connection</p>
                                        <p><strong>Scroll wheel</strong> — Zoom in/out</p>
                                        <p><strong>Drag canvas</strong> — Pan view</p>
                                    </div>
                                </div>
                            </HelpSection>

                            {/* Node Types */}
                            <HelpSection
                                icon={<Zap className="h-5 w-5" />}
                                title="Node Types"
                            >
                                <div className="grid grid-cols-3 gap-3 text-sm">
                                    <NodeTypeCard color="bg-green-500" name="Start" desc="Flow entry point" />
                                    <NodeTypeCard color="bg-blue-500" name="Message" desc="Send response" />
                                    <NodeTypeCard color="bg-purple-500" name="Collect Input" desc="Gather user input" />
                                    <NodeTypeCard color="bg-amber-500" name="LLM Router" desc="AI intent classification" />
                                    <NodeTypeCard color="bg-cyan-500" name="Knowledge" desc="RAG retrieval" />
                                    <NodeTypeCard color="bg-pink-500" name="Tool Call" desc="External API" />
                                    <NodeTypeCard color="bg-orange-500" name="Condition" desc="If/else logic" />
                                    <NodeTypeCard color="bg-red-500" name="Escalate" desc="Human handoff" />
                                    <NodeTypeCard color="bg-gray-500" name="End" desc="Terminate flow" />
                                </div>
                            </HelpSection>

                            {/* Tips */}
                            <HelpSection
                                icon={<MessageSquare className="h-5 w-5" />}
                                title="Tips"
                            >
                                <div className="space-y-2 text-sm text-muted-foreground">
                                    <p>• Use <code className="rounded bg-muted px-1">{"{{variable}}"}</code> syntax to interpolate variables in messages</p>
                                    <p>• The LLM Router supports keyword fallback when AI is unavailable</p>
                                    <p>• Export flows as JSON to share or version control</p>
                                    <p>• Use the simulator to test your flow before publishing</p>
                                </div>
                            </HelpSection>
                        </div>

                        {/* Footer */}
                        <div className="border-t border-border p-4 text-center text-sm text-muted-foreground">
                            Press <kbd className="rounded bg-muted px-2 py-1 text-xs font-medium">?</kbd> anytime to open this help
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}

function HelpSection({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
    return (
        <div className="mb-6">
            <div className="mb-3 flex items-center gap-2 text-sm font-semibold">
                {icon}
                {title}
            </div>
            {children}
        </div>
    );
}

function ShortcutGroup({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div>
            <p className="mb-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">{title}</p>
            <div className="space-y-1.5">
                {children}
            </div>
        </div>
    );
}

function Shortcut({ keys, action }: { keys: string[]; action: string }) {
    return (
        <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">{action}</span>
            <div className="flex items-center gap-1">
                {keys.map((key, i) => (
                    <span key={i}>
                        {i > 0 && <span className="mx-0.5 text-muted-foreground">+</span>}
                        <kbd className="rounded bg-muted px-1.5 py-0.5 text-xs font-medium">
                            {key}
                        </kbd>
                    </span>
                ))}
            </div>
        </div>
    );
}

function NodeTypeCard({ color, name, desc }: { color: string; name: string; desc: string }) {
    return (
        <div className="flex items-center gap-2 rounded-lg bg-muted/50 p-2">
            <div className={`h-3 w-3 rounded-full ${color}`} />
            <div>
                <p className="font-medium text-xs">{name}</p>
                <p className="text-xs text-muted-foreground">{desc}</p>
            </div>
        </div>
    );
}
