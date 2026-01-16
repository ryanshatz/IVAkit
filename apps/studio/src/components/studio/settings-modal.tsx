'use client';

import { useAtom } from 'jotai';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Server, Brain, Key, Palette, Save, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { settingsAtom, settingsOpenAtom } from '@/store/flow-store';

export function SettingsModal() {
    const [isOpen, setIsOpen] = useAtom(settingsOpenAtom);
    const [settings, setSettings] = useAtom(settingsAtom);

    const updateSetting = <K extends keyof typeof settings>(key: K, value: typeof settings[K]) => {
        setSettings({ ...settings, [key]: value });
    };

    const resetToDefaults = () => {
        setSettings({
            theme: 'dark',
            autoSave: true,
            autoSaveInterval: 30,
            snapToGrid: true,
            gridSize: 15,
            showMinimap: true,
            showControls: true,
            aiProvider: 'ollama',
            ollamaUrl: 'http://localhost:11434',
            ollamaModel: 'llama3.2',
            openaiApiKey: '',
            anthropicApiKey: '',
        });
    };

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
                        className="fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-xl border border-border bg-card shadow-2xl"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between border-b border-border p-4">
                            <h2 className="text-lg font-semibold">Settings</h2>
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
                        <div className="max-h-[60vh] overflow-y-auto p-4">
                            {/* Editor Settings */}
                            <SettingsSection title="Editor" icon={<Palette className="h-4 w-4" />}>
                                <SettingsRow label="Theme">
                                    <select
                                        value={settings.theme}
                                        onChange={(e) => updateSetting('theme', e.target.value as 'dark' | 'light' | 'system')}
                                        className="rounded-md border border-input bg-background px-3 py-1.5 text-sm"
                                    >
                                        <option value="dark">Dark</option>
                                        <option value="light">Light</option>
                                        <option value="system">System</option>
                                    </select>
                                </SettingsRow>
                                <SettingsRow label="Auto Save">
                                    <label className="relative inline-flex cursor-pointer items-center">
                                        <input
                                            type="checkbox"
                                            checked={settings.autoSave}
                                            onChange={(e) => updateSetting('autoSave', e.target.checked)}
                                            className="peer sr-only"
                                        />
                                        <div className="h-5 w-9 rounded-full bg-muted peer-checked:bg-primary peer-focus:ring-2 peer-focus:ring-ring after:absolute after:left-[2px] after:top-[2px] after:h-4 after:w-4 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:after:translate-x-full" />
                                    </label>
                                </SettingsRow>
                                {settings.autoSave && (
                                    <SettingsRow label="Auto Save Interval">
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="number"
                                                value={settings.autoSaveInterval}
                                                onChange={(e) => updateSetting('autoSaveInterval', parseInt(e.target.value) || 30)}
                                                min={5}
                                                max={300}
                                                className="w-20 rounded-md border border-input bg-background px-3 py-1.5 text-sm"
                                            />
                                            <span className="text-sm text-muted-foreground">seconds</span>
                                        </div>
                                    </SettingsRow>
                                )}
                                <SettingsRow label="Snap to Grid">
                                    <label className="relative inline-flex cursor-pointer items-center">
                                        <input
                                            type="checkbox"
                                            checked={settings.snapToGrid}
                                            onChange={(e) => updateSetting('snapToGrid', e.target.checked)}
                                            className="peer sr-only"
                                        />
                                        <div className="h-5 w-9 rounded-full bg-muted peer-checked:bg-primary peer-focus:ring-2 peer-focus:ring-ring after:absolute after:left-[2px] after:top-[2px] after:h-4 after:w-4 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:after:translate-x-full" />
                                    </label>
                                </SettingsRow>
                                <SettingsRow label="Grid Size">
                                    <input
                                        type="number"
                                        value={settings.gridSize}
                                        onChange={(e) => updateSetting('gridSize', parseInt(e.target.value) || 15)}
                                        min={5}
                                        max={50}
                                        className="w-20 rounded-md border border-input bg-background px-3 py-1.5 text-sm"
                                    />
                                </SettingsRow>
                                <SettingsRow label="Show Minimap">
                                    <label className="relative inline-flex cursor-pointer items-center">
                                        <input
                                            type="checkbox"
                                            checked={settings.showMinimap}
                                            onChange={(e) => updateSetting('showMinimap', e.target.checked)}
                                            className="peer sr-only"
                                        />
                                        <div className="h-5 w-9 rounded-full bg-muted peer-checked:bg-primary peer-focus:ring-2 peer-focus:ring-ring after:absolute after:left-[2px] after:top-[2px] after:h-4 after:w-4 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:after:translate-x-full" />
                                    </label>
                                </SettingsRow>
                            </SettingsSection>

                            {/* AI Settings */}
                            <SettingsSection title="AI Provider" icon={<Brain className="h-4 w-4" />}>
                                <SettingsRow label="Provider">
                                    <select
                                        value={settings.aiProvider}
                                        onChange={(e) => updateSetting('aiProvider', e.target.value as 'ollama' | 'openai' | 'anthropic')}
                                        className="rounded-md border border-input bg-background px-3 py-1.5 text-sm"
                                    >
                                        <option value="ollama">Ollama (Local)</option>
                                        <option value="openai">OpenAI</option>
                                        <option value="anthropic">Anthropic</option>
                                    </select>
                                </SettingsRow>

                                {settings.aiProvider === 'ollama' && (
                                    <>
                                        <SettingsRow label="Ollama URL">
                                            <input
                                                type="text"
                                                value={settings.ollamaUrl}
                                                onChange={(e) => updateSetting('ollamaUrl', e.target.value)}
                                                placeholder="http://localhost:11434"
                                                className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm"
                                            />
                                        </SettingsRow>
                                        <SettingsRow label="Model">
                                            <input
                                                type="text"
                                                value={settings.ollamaModel}
                                                onChange={(e) => updateSetting('ollamaModel', e.target.value)}
                                                placeholder="llama3.2"
                                                className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm"
                                            />
                                        </SettingsRow>
                                    </>
                                )}

                                {settings.aiProvider === 'openai' && (
                                    <SettingsRow label="API Key">
                                        <input
                                            type="password"
                                            value={settings.openaiApiKey}
                                            onChange={(e) => updateSetting('openaiApiKey', e.target.value)}
                                            placeholder="sk-..."
                                            className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm"
                                        />
                                    </SettingsRow>
                                )}

                                {settings.aiProvider === 'anthropic' && (
                                    <SettingsRow label="API Key">
                                        <input
                                            type="password"
                                            value={settings.anthropicApiKey}
                                            onChange={(e) => updateSetting('anthropicApiKey', e.target.value)}
                                            placeholder="sk-ant-..."
                                            className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm"
                                        />
                                    </SettingsRow>
                                )}
                            </SettingsSection>

                            {/* Server Settings */}
                            <SettingsSection title="Server" icon={<Server className="h-4 w-4" />}>
                                <SettingsRow label="API Endpoint">
                                    <input
                                        type="text"
                                        defaultValue="http://localhost:3001"
                                        className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm"
                                    />
                                </SettingsRow>
                            </SettingsSection>
                        </div>

                        {/* Footer */}
                        <div className="flex items-center justify-between border-t border-border p-4">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={resetToDefaults}
                                className="gap-2"
                            >
                                <RotateCcw className="h-4 w-4" />
                                Reset to Defaults
                            </Button>
                            <Button size="sm" onClick={() => setIsOpen(false)} className="gap-2">
                                <Save className="h-4 w-4" />
                                Save & Close
                            </Button>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}

function SettingsSection({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
    return (
        <div className="mb-6">
            <div className="mb-3 flex items-center gap-2 text-sm font-medium">
                {icon}
                {title}
            </div>
            <div className="space-y-3 rounded-lg bg-muted/50 p-3">
                {children}
            </div>
        </div>
    );
}

function SettingsRow({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">{label}</span>
            {children}
        </div>
    );
}
