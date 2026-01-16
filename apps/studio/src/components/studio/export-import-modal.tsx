'use client';

import { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, Upload, Copy, Check, FileJson, AlertCircle } from 'lucide-react';
import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import { atom } from 'jotai';
import { Button } from '@/components/ui/button';
import { flowStateAtom, saveToHistoryAtom } from '@/store/flow-store';

// Export/Import modal state
export const exportImportOpenAtom = atom<'export' | 'import' | null>(null);

export function ExportImportModal() {
    const [mode, setMode] = useAtom(exportImportOpenAtom);
    const flowState = useAtomValue(flowStateAtom);
    const [importData, setImportData] = useState('');
    const [importError, setImportError] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);
    const [setFlowState] = useAtom(flowStateAtom);
    const saveToHistory = useSetAtom(saveToHistoryAtom);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const exportData = JSON.stringify({
        version: '1.0',
        exportedAt: new Date().toISOString(),
        flow: {
            id: flowState.flowId,
            name: flowState.flowName,
            nodes: flowState.nodes,
            edges: flowState.edges,
        }
    }, null, 2);

    const handleCopy = useCallback(async () => {
        await navigator.clipboard.writeText(exportData);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    }, [exportData]);

    const handleDownload = useCallback(() => {
        const blob = new Blob([exportData], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${flowState.flowName.toLowerCase().replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }, [exportData, flowState.flowName]);

    const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const content = event.target?.result as string;
            setImportData(content);
            setImportError(null);
        };
        reader.onerror = () => {
            setImportError('Failed to read file');
        };
        reader.readAsText(file);
    }, []);

    const handleImport = useCallback(() => {
        try {
            const parsed = JSON.parse(importData);

            // Validate structure
            if (!parsed.flow || !parsed.flow.nodes || !parsed.flow.edges) {
                throw new Error('Invalid flow format: missing nodes or edges');
            }

            if (!Array.isArray(parsed.flow.nodes) || !Array.isArray(parsed.flow.edges)) {
                throw new Error('Invalid flow format: nodes and edges must be arrays');
            }

            // Save current state to history before importing
            saveToHistory();

            // Import the flow
            setFlowState((prev: typeof flowState) => ({
                ...prev,
                flowId: parsed.flow.id || `flow_${Date.now()}`,
                flowName: parsed.flow.name || 'Imported Flow',
                nodes: parsed.flow.nodes,
                edges: parsed.flow.edges,
                isDirty: true,
            }));

            setMode(null);
            setImportData('');
            setImportError(null);
        } catch (error) {
            setImportError(error instanceof Error ? error.message : 'Invalid JSON format');
        }
    }, [importData, saveToHistory, setFlowState, setMode]);

    const isOpen = mode !== null;

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
                        onClick={() => setMode(null)}
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        transition={{ type: 'spring', duration: 0.3 }}
                        className="fixed left-1/2 top-1/2 z-50 w-full max-w-xl -translate-x-1/2 -translate-y-1/2 rounded-xl border border-border bg-card shadow-2xl"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between border-b border-border p-4">
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-purple-600">
                                    {mode === 'export' ? (
                                        <Download className="h-5 w-5 text-white" />
                                    ) : (
                                        <Upload className="h-5 w-5 text-white" />
                                    )}
                                </div>
                                <div>
                                    <h2 className="text-lg font-semibold">
                                        {mode === 'export' ? 'Export Flow' : 'Import Flow'}
                                    </h2>
                                    <p className="text-sm text-muted-foreground">
                                        {mode === 'export'
                                            ? 'Download or copy your flow as JSON'
                                            : 'Load a flow from a JSON file'
                                        }
                                    </p>
                                </div>
                            </div>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => setMode(null)}
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </div>

                        {/* Content */}
                        <div className="p-4">
                            {mode === 'export' ? (
                                <div className="space-y-4">
                                    {/* Flow Info */}
                                    <div className="flex items-center gap-3 rounded-lg bg-muted/50 p-3">
                                        <FileJson className="h-8 w-8 text-muted-foreground" />
                                        <div>
                                            <p className="font-medium">{flowState.flowName}</p>
                                            <p className="text-sm text-muted-foreground">
                                                {flowState.nodes.length} nodes • {flowState.edges.length} edges
                                            </p>
                                        </div>
                                    </div>

                                    {/* Preview */}
                                    <div>
                                        <label className="mb-2 block text-sm font-medium">JSON Preview</label>
                                        <pre className="max-h-64 overflow-auto rounded-lg bg-muted p-3 font-mono text-xs">
                                            {exportData}
                                        </pre>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {/* File Upload */}
                                    <div
                                        onClick={() => fileInputRef.current?.click()}
                                        className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-border p-8 transition-colors hover:border-primary hover:bg-muted/50"
                                    >
                                        <Upload className="mb-3 h-10 w-10 text-muted-foreground" />
                                        <p className="text-sm font-medium">Click to upload a JSON file</p>
                                        <p className="text-xs text-muted-foreground">or drag and drop</p>
                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            accept=".json"
                                            onChange={handleFileSelect}
                                            className="hidden"
                                        />
                                    </div>

                                    {/* Or paste JSON */}
                                    <div className="relative">
                                        <div className="absolute inset-x-0 top-1/2 border-t border-border" />
                                        <div className="relative flex justify-center">
                                            <span className="bg-card px-2 text-xs text-muted-foreground">or paste JSON</span>
                                        </div>
                                    </div>

                                    {/* Text Input */}
                                    <textarea
                                        value={importData}
                                        onChange={(e) => {
                                            setImportData(e.target.value);
                                            setImportError(null);
                                        }}
                                        placeholder='{"version": "1.0", "flow": {...}}'
                                        rows={8}
                                        className="w-full resize-none rounded-lg border border-input bg-background p-3 font-mono text-xs outline-none focus:ring-1 focus:ring-ring"
                                    />

                                    {/* Error */}
                                    {importError && (
                                        <div className="flex items-center gap-2 rounded-lg bg-red-500/10 p-3 text-sm text-red-500">
                                            <AlertCircle className="h-4 w-4" />
                                            {importError}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="flex items-center justify-end gap-2 border-t border-border p-4">
                            <Button variant="ghost" onClick={() => setMode(null)}>
                                Cancel
                            </Button>
                            {mode === 'export' ? (
                                <>
                                    <Button variant="outline" onClick={handleCopy} className="gap-2">
                                        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                                        {copied ? 'Copied!' : 'Copy'}
                                    </Button>
                                    <Button onClick={handleDownload} className="gap-2">
                                        <Download className="h-4 w-4" />
                                        Download
                                    </Button>
                                </>
                            ) : (
                                <Button
                                    onClick={handleImport}
                                    disabled={!importData.trim()}
                                    className="gap-2"
                                >
                                    <Upload className="h-4 w-4" />
                                    Import Flow
                                </Button>
                            )}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
