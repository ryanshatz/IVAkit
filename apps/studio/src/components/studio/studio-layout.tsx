'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    PanelLeftClose,
    PanelLeftOpen,
    Play,
    Save,
    Undo,
    Redo,
    Settings,
    HelpCircle,
    Moon,
    Sun,
    CheckCircle,
    AlertCircle,
} from 'lucide-react';
import { useTheme } from 'next-themes';
import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import { FlowBuilder } from './flow-builder';
import { NodePalette } from './node-palette';
import { ConfigPanel } from './config-panel';
import { SimulatorPanel } from './simulator-panel';
import { SettingsModal } from './settings-modal';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
    flowStateAtom,
    selectedNodeIdAtom,
    leftPanelOpenAtom,
    rightPanelOpenAtom,
    simulatorOpenAtom,
    settingsOpenAtom,
    nodeCountAtom,
    edgeCountAtom,
    flowValidationAtom,
    canUndoAtom,
    canRedoAtom,
    undoAtom,
    redoAtom,
    markAsSavedAtom,
    updateFlowNameAtom,
} from '@/store/flow-store';

export function StudioLayout() {
    const [leftPanelOpen, setLeftPanelOpen] = useAtom(leftPanelOpenAtom);
    const [rightPanelOpen, setRightPanelOpen] = useAtom(rightPanelOpenAtom);
    const [simulatorOpen, setSimulatorOpen] = useAtom(simulatorOpenAtom);
    const [selectedNodeId, setSelectedNodeId] = useAtom(selectedNodeIdAtom);
    const setSettingsOpen = useSetAtom(settingsOpenAtom);

    // Flow state
    const flowState = useAtomValue(flowStateAtom);
    const nodeCount = useAtomValue(nodeCountAtom);
    const edgeCount = useAtomValue(edgeCountAtom);
    const validation = useAtomValue(flowValidationAtom);

    // Undo/Redo
    const canUndo = useAtomValue(canUndoAtom);
    const canRedo = useAtomValue(canRedoAtom);
    const undo = useSetAtom(undoAtom);
    const redo = useSetAtom(redoAtom);

    // Actions
    const markAsSaved = useSetAtom(markAsSavedAtom);
    const updateFlowName = useSetAtom(updateFlowNameAtom);

    // Theme
    const [mounted, setMounted] = useState(false);
    const { theme, setTheme } = useTheme();

    // Prevent hydration mismatch
    useEffect(() => {
        setMounted(true);
    }, []);

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Ctrl/Cmd + Z = Undo
            if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
                e.preventDefault();
                if (canUndo) undo();
            }
            // Ctrl/Cmd + Shift + Z or Ctrl/Cmd + Y = Redo
            if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
                e.preventDefault();
                if (canRedo) redo();
            }
            // Ctrl/Cmd + S = Save
            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                e.preventDefault();
                handleSave();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [canUndo, canRedo, undo, redo]);

    // Handle save
    const handleSave = useCallback(() => {
        // In a real app, this would call the API
        console.log('Saving flow...', flowState);
        markAsSaved();
    }, [flowState, markAsSaved]);

    // Format last saved time
    const formatLastSaved = () => {
        if (!flowState.lastSaved) return 'Never saved';

        const now = new Date();
        const diff = now.getTime() - new Date(flowState.lastSaved).getTime();

        if (diff < 60000) return 'Just now';
        if (diff < 3600000) return `${Math.floor(diff / 60000)} min ago`;
        return flowState.lastSaved.toLocaleTimeString();
    };

    return (
        <div className="flex h-screen w-full flex-col overflow-hidden bg-background">
            {/* Header */}
            <header className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-card px-4">
                <div className="flex items-center gap-4">
                    {/* Logo */}
                    <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 via-cyan-500 to-purple-600">
                            <span className="text-lg font-bold text-white">I</span>
                        </div>
                        <span className="text-lg font-semibold">IVAkit</span>
                    </div>

                    {/* Flow Name */}
                    <div className="hidden items-center gap-2 md:flex">
                        <span className="text-muted-foreground">/</span>
                        <input
                            type="text"
                            value={flowState.flowName}
                            onChange={(e) => updateFlowName(e.target.value)}
                            className="bg-transparent text-sm font-medium outline-none focus:ring-1 focus:ring-primary rounded px-2 py-1 border border-transparent hover:border-border"
                        />
                        {flowState.isDirty && (
                            <span className="text-xs text-muted-foreground">•</span>
                        )}
                    </div>
                </div>

                {/* Center Actions */}
                <div className="hidden items-center gap-1 md:flex">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        disabled={!canUndo}
                        onClick={() => undo()}
                        title="Undo (Ctrl+Z)"
                    >
                        <Undo className={cn("h-4 w-4", !canUndo && "opacity-50")} />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        disabled={!canRedo}
                        onClick={() => redo()}
                        title="Redo (Ctrl+Shift+Z)"
                    >
                        <Redo className={cn("h-4 w-4", !canRedo && "opacity-50")} />
                    </Button>
                    <div className="mx-2 h-4 w-px bg-border" />
                    <Button
                        variant="ghost"
                        size="sm"
                        className="gap-2"
                        onClick={handleSave}
                    >
                        <Save className="h-4 w-4" />
                        Save
                    </Button>
                    <Button
                        variant="default"
                        size="sm"
                        className="gap-2"
                        onClick={() => setSimulatorOpen(!simulatorOpen)}
                    >
                        <Play className="h-4 w-4" />
                        Simulate
                    </Button>
                </div>

                {/* Right Actions */}
                <div className="flex items-center gap-2">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                        title="Toggle Theme"
                    >
                        {mounted && theme === 'dark' ? (
                            <Sun className="h-4 w-4" />
                        ) : (
                            <Moon className="h-4 w-4" />
                        )}
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setSettingsOpen(true)}
                        title="Settings"
                    >
                        <Settings className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" title="Help">
                        <HelpCircle className="h-4 w-4" />
                    </Button>
                </div>
            </header>

            {/* Main Content */}
            <div className="flex flex-1 overflow-hidden">
                {/* Left Panel - Node Palette */}
                <AnimatePresence mode="wait">
                    {leftPanelOpen && (
                        <motion.aside
                            initial={{ width: 0, opacity: 0 }}
                            animate={{ width: 280, opacity: 1 }}
                            exit={{ width: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="shrink-0 border-r border-border bg-card overflow-hidden"
                        >
                            <NodePalette />
                        </motion.aside>
                    )}
                </AnimatePresence>

                {/* Toggle Left Panel */}
                <button
                    onClick={() => setLeftPanelOpen(!leftPanelOpen)}
                    className="absolute left-0 top-1/2 z-10 -translate-y-1/2 translate-x-0 rounded-r-lg border border-l-0 border-border bg-card p-1 hover:bg-accent"
                    style={{ left: leftPanelOpen ? 280 : 0 }}
                >
                    {leftPanelOpen ? (
                        <PanelLeftClose className="h-4 w-4" />
                    ) : (
                        <PanelLeftOpen className="h-4 w-4" />
                    )}
                </button>

                {/* Flow Canvas */}
                <main className="relative flex-1 overflow-hidden">
                    <FlowBuilder
                        onNodeSelect={setSelectedNodeId}
                        selectedNodeId={selectedNodeId}
                    />
                </main>

                {/* Toggle Right Panel */}
                <button
                    onClick={() => setRightPanelOpen(!rightPanelOpen)}
                    className="absolute right-0 top-1/2 z-10 -translate-y-1/2 translate-x-0 rounded-l-lg border border-r-0 border-border bg-card p-1 hover:bg-accent"
                    style={{ right: rightPanelOpen ? (simulatorOpen ? 720 : 360) : 0 }}
                >
                    {rightPanelOpen ? (
                        <PanelLeftOpen className="h-4 w-4" />
                    ) : (
                        <PanelLeftClose className="h-4 w-4" />
                    )}
                </button>

                {/* Right Panel - Config / Simulator */}
                <AnimatePresence mode="wait">
                    {rightPanelOpen && (
                        <motion.aside
                            initial={{ width: 0, opacity: 0 }}
                            animate={{ width: simulatorOpen ? 720 : 360, opacity: 1 }}
                            exit={{ width: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="shrink-0 border-l border-border bg-card overflow-hidden"
                        >
                            <div className={cn(
                                "flex h-full",
                                simulatorOpen ? "w-[720px]" : "w-[360px]"
                            )}>
                                {/* Config Panel */}
                                <div className={cn(
                                    "h-full overflow-hidden border-r border-border",
                                    simulatorOpen ? "w-[360px]" : "w-full"
                                )}>
                                    <ConfigPanel
                                        selectedNodeId={selectedNodeId}
                                        onClose={() => setSelectedNodeId(null)}
                                    />
                                </div>

                                {/* Simulator Panel */}
                                <AnimatePresence>
                                    {simulatorOpen && (
                                        <motion.div
                                            initial={{ width: 0, opacity: 0 }}
                                            animate={{ width: 360, opacity: 1 }}
                                            exit={{ width: 0, opacity: 0 }}
                                            className="h-full w-[360px]"
                                        >
                                            <SimulatorPanel onClose={() => setSimulatorOpen(false)} />
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </motion.aside>
                    )}
                </AnimatePresence>
            </div>

            {/* Status Bar */}
            <footer className="flex h-6 shrink-0 items-center justify-between border-t border-border bg-card px-4 text-xs text-muted-foreground">
                <div className="flex items-center gap-4">
                    <span>{nodeCount} nodes</span>
                    <span>•</span>
                    <span>{edgeCount} edges</span>
                    <span>•</span>
                    {validation.isValid ? (
                        <span className="flex items-center gap-1 text-green-500">
                            <CheckCircle className="h-3 w-3" />
                            Valid
                        </span>
                    ) : (
                        <span className="flex items-center gap-1 text-yellow-500" title={validation.errors.join(', ')}>
                            <AlertCircle className="h-3 w-3" />
                            {validation.errors.length} issue{validation.errors.length !== 1 ? 's' : ''}
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-4">
                    <span>
                        {flowState.isDirty ? 'Unsaved changes' : formatLastSaved()}
                    </span>
                    <span>•</span>
                    <span>v1.0</span>
                </div>
            </footer>

            {/* Settings Modal */}
            <SettingsModal />
        </div>
    );
}
