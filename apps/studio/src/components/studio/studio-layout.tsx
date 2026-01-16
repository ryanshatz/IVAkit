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
    Download,
    Upload,
    MoreVertical,
} from 'lucide-react';
import { useTheme } from 'next-themes';
import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import { FlowBuilder } from './flow-builder';
import { NodePalette } from './node-palette';
import { ConfigPanel } from './config-panel';
import { SimulatorPanel } from './simulator-panel';
import { SettingsModal } from './settings-modal';
import { HelpModal, helpOpenAtom } from './help-modal';
import { ExportImportModal, exportImportOpenAtom } from './export-import-modal';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast-provider';
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
    deleteNodeAtom,
    duplicateNodeAtom,
} from '@/store/flow-store';

export function StudioLayout() {
    const [leftPanelOpen, setLeftPanelOpen] = useAtom(leftPanelOpenAtom);
    const [rightPanelOpen, setRightPanelOpen] = useAtom(rightPanelOpenAtom);
    const [simulatorOpen, setSimulatorOpen] = useAtom(simulatorOpenAtom);
    const [selectedNodeId, setSelectedNodeId] = useAtom(selectedNodeIdAtom);
    const setSettingsOpen = useSetAtom(settingsOpenAtom);
    const setHelpOpen = useSetAtom(helpOpenAtom);
    const setExportImportMode = useSetAtom(exportImportOpenAtom);

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
    const deleteNode = useSetAtom(deleteNodeAtom);
    const duplicateNode = useSetAtom(duplicateNodeAtom);

    // Theme
    const [mounted, setMounted] = useState(false);
    const { theme, setTheme } = useTheme();

    // Toast
    const { addToast } = useToast();

    // Prevent hydration mismatch
    useEffect(() => {
        setMounted(true);
    }, []);

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Don't trigger if typing in an input
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
                return;
            }

            // ? = Help
            if (e.key === '?' || (e.key === '/' && e.shiftKey)) {
                e.preventDefault();
                setHelpOpen(true);
                return;
            }

            // Ctrl/Cmd + Z = Undo
            if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
                e.preventDefault();
                if (canUndo) {
                    undo();
                    addToast({ type: 'info', title: 'Undo', description: 'Action undone', duration: 2000 });
                }
                return;
            }

            // Ctrl/Cmd + Shift + Z or Ctrl/Cmd + Y = Redo
            if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
                e.preventDefault();
                if (canRedo) {
                    redo();
                    addToast({ type: 'info', title: 'Redo', description: 'Action redone', duration: 2000 });
                }
                return;
            }

            // Ctrl/Cmd + S = Save
            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                e.preventDefault();
                handleSave();
                return;
            }

            // Ctrl/Cmd + E = Export
            if ((e.ctrlKey || e.metaKey) && e.key === 'e') {
                e.preventDefault();
                setExportImportMode('export');
                return;
            }

            // Ctrl/Cmd + I = Import
            if ((e.ctrlKey || e.metaKey) && e.key === 'i') {
                e.preventDefault();
                setExportImportMode('import');
                return;
            }

            // Delete = Delete selected node
            if (e.key === 'Delete' && selectedNodeId) {
                e.preventDefault();
                const nodeName = flowState.nodes.find(n => n.id === selectedNodeId)?.data.name || 'Node';
                deleteNode(selectedNodeId);
                addToast({ type: 'success', title: 'Node Deleted', description: `${nodeName} removed from flow` });
                return;
            }

            // Ctrl/Cmd + D = Duplicate node
            if ((e.ctrlKey || e.metaKey) && e.key === 'd' && selectedNodeId) {
                e.preventDefault();
                duplicateNode(selectedNodeId);
                addToast({ type: 'success', title: 'Node Duplicated', description: 'Copy created' });
                return;
            }

            // Escape = Deselect node
            if (e.key === 'Escape') {
                setSelectedNodeId(null);
                return;
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [canUndo, canRedo, undo, redo, selectedNodeId, deleteNode, duplicateNode, addToast, setHelpOpen, setExportImportMode, flowState.nodes, setSelectedNodeId]);

    // Handle save
    const handleSave = useCallback(() => {
        // In a real app, this would call the API
        console.log('Saving flow...', flowState);
        markAsSaved();
        addToast({
            type: 'success',
            title: 'Flow Saved',
            description: `${flowState.flowName} saved successfully`
        });
    }, [flowState, markAsSaved, addToast]);

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
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 via-cyan-500 to-purple-600 shadow-lg shadow-blue-500/25">
                            <span className="text-lg font-bold text-white">I</span>
                        </div>
                        <span className="text-lg font-semibold bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">IVAkit</span>
                    </div>

                    {/* Flow Name */}
                    <div className="hidden items-center gap-2 md:flex">
                        <span className="text-muted-foreground">/</span>
                        <input
                            type="text"
                            value={flowState.flowName}
                            onChange={(e) => updateFlowName(e.target.value)}
                            className="bg-transparent text-sm font-medium outline-none focus:ring-1 focus:ring-primary rounded px-2 py-1 border border-transparent hover:border-border transition-colors"
                        />
                        {flowState.isDirty && (
                            <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" title="Unsaved changes" />
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
                        onClick={() => { undo(); addToast({ type: 'info', title: 'Undo', duration: 1500 }); }}
                        title="Undo (Ctrl+Z)"
                    >
                        <Undo className={cn("h-4 w-4", !canUndo && "opacity-50")} />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        disabled={!canRedo}
                        onClick={() => { redo(); addToast({ type: 'info', title: 'Redo', duration: 1500 }); }}
                        title="Redo (Ctrl+Shift+Z)"
                    >
                        <Redo className={cn("h-4 w-4", !canRedo && "opacity-50")} />
                    </Button>
                    <div className="mx-2 h-4 w-px bg-border" />
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setExportImportMode('export')}
                        title="Export Flow (Ctrl+E)"
                    >
                        <Download className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setExportImportMode('import')}
                        title="Import Flow (Ctrl+I)"
                    >
                        <Upload className="h-4 w-4" />
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
                        className="gap-2 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                        onClick={() => setSimulatorOpen(!simulatorOpen)}
                    >
                        <Play className="h-4 w-4" />
                        Simulate
                    </Button>
                </div>

                {/* Right Actions */}
                <div className="flex items-center gap-1">
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
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        title="Help (?)"
                        onClick={() => setHelpOpen(true)}
                    >
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
                    className="absolute left-0 top-1/2 z-10 -translate-y-1/2 translate-x-0 rounded-r-lg border border-l-0 border-border bg-card p-1 hover:bg-accent transition-colors"
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
                    className="absolute right-0 top-1/2 z-10 -translate-y-1/2 translate-x-0 rounded-l-lg border border-r-0 border-border bg-card p-1 hover:bg-accent transition-colors"
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
            <footer className="flex h-7 shrink-0 items-center justify-between border-t border-border bg-card px-4 text-xs text-muted-foreground">
                <div className="flex items-center gap-4">
                    <span className="font-medium">{nodeCount} nodes</span>
                    <span className="text-muted-foreground/50">•</span>
                    <span className="font-medium">{edgeCount} edges</span>
                    <span className="text-muted-foreground/50">•</span>
                    {validation.isValid ? (
                        <span className="flex items-center gap-1 text-green-500">
                            <CheckCircle className="h-3 w-3" />
                            Valid
                        </span>
                    ) : (
                        <span className="flex items-center gap-1 text-amber-500 cursor-help" title={validation.errors.join('\n')}>
                            <AlertCircle className="h-3 w-3" />
                            {validation.errors.length} issue{validation.errors.length !== 1 ? 's' : ''}
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-4">
                    <span className={flowState.isDirty ? 'text-amber-500' : ''}>
                        {flowState.isDirty ? '● Unsaved changes' : formatLastSaved()}
                    </span>
                    <span className="text-muted-foreground/50">•</span>
                    <span>v1.0</span>
                    <span className="text-muted-foreground/50">•</span>
                    <span
                        className="cursor-pointer hover:text-foreground transition-colors"
                        onClick={() => setHelpOpen(true)}
                    >
                        Press ? for help
                    </span>
                </div>
            </footer>

            {/* Modals */}
            <SettingsModal />
            <HelpModal />
            <ExportImportModal />
        </div>
    );
}
