'use client';

import { useState } from 'react';
import { useAtom } from 'jotai';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Server, Brain, Key, Palette, Save, RotateCcw, Eye, EyeOff, Check, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { settingsAtom, settingsOpenAtom } from '@/store/flow-store';

const AI_PROVIDERS = [
    { id: 'ollama', name: 'Ollama (Local)', description: 'Free, runs on your machine', icon: '🏠' },
    { id: 'openai', name: 'OpenAI', description: 'GPT-4, GPT-4o, GPT-3.5', icon: '🤖' },
    { id: 'anthropic', name: 'Anthropic', description: 'Claude 3 Opus, Sonnet, Haiku', icon: '🧠' },
] as const;

const OPENAI_MODELS = [
    { id: 'gpt-4o', name: 'GPT-4o', description: 'Latest multimodal model' },
    { id: 'gpt-4-turbo', name: 'GPT-4 Turbo', description: 'Powerful and fast' },
    { id: 'gpt-4', name: 'GPT-4', description: 'Most capable' },
    { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', description: 'Fast and affordable' },
];

const ANTHROPIC_MODELS = [
    { id: 'claude-3-opus-20240229', name: 'Claude 3 Opus', description: 'Most capable' },
    { id: 'claude-3-sonnet-20240229', name: 'Claude 3 Sonnet', description: 'Balanced' },
    { id: 'claude-3-haiku-20240307', name: 'Claude 3 Haiku', description: 'Fast and affordable' },
];

export function SettingsModal() {
    const [isOpen, setIsOpen] = useAtom(settingsOpenAtom);
    const [settings, setSettings] = useAtom(settingsAtom);
    const [showApiKey, setShowApiKey] = useState(false);
    const [testingConnection, setTestingConnection] = useState(false);
    const [connectionStatus, setConnectionStatus] = useState<'idle' | 'success' | 'error'>('idle');

    const updateSetting = <K extends keyof typeof settings>(key: K, value: typeof settings[K]) => {
        setSettings({ ...settings, [key]: value });
        setConnectionStatus('idle');
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
            openaiModel: 'gpt-4o',
            anthropicApiKey: '',
            anthropicModel: 'claude-3-sonnet-20240229',
        });
        setConnectionStatus('idle');
    };

    const testConnection = async () => {
        setTestingConnection(true);
        setConnectionStatus('idle');

        try {
            if (settings.aiProvider === 'ollama') {
                // Test Ollama connection
                const response = await fetch(`${settings.ollamaUrl}/api/tags`, {
                    method: 'GET',
                });
                if (response.ok) {
                    setConnectionStatus('success');
                } else {
                    setConnectionStatus('error');
                }
            } else if (settings.aiProvider === 'openai') {
                // Test OpenAI API key (just check format for now)
                if (settings.openaiApiKey?.startsWith('sk-')) {
                    setConnectionStatus('success');
                } else {
                    setConnectionStatus('error');
                }
            } else if (settings.aiProvider === 'anthropic') {
                // Test Anthropic API key (just check format for now)
                if (settings.anthropicApiKey?.startsWith('sk-ant-')) {
                    setConnectionStatus('success');
                } else {
                    setConnectionStatus('error');
                }
            }
        } catch {
            setConnectionStatus('error');
        }

        setTestingConnection(false);
    };

    const currentApiKey = settings.aiProvider === 'openai'
        ? settings.openaiApiKey
        : settings.aiProvider === 'anthropic'
            ? settings.anthropicApiKey
            : '';

    const maskApiKey = (key: string) => {
        if (!key || key.length < 10) return key;
        return key.substring(0, 7) + '...' + key.substring(key.length - 4);
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
                                    <Toggle checked={settings.autoSave} onChange={(v) => updateSetting('autoSave', v)} />
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
                                    <Toggle checked={settings.snapToGrid} onChange={(v) => updateSetting('snapToGrid', v)} />
                                </SettingsRow>
                                <SettingsRow label="Show Minimap">
                                    <Toggle checked={settings.showMinimap} onChange={(v) => updateSetting('showMinimap', v)} />
                                </SettingsRow>
                            </SettingsSection>

                            {/* AI Provider Settings */}
                            <SettingsSection title="AI Provider" icon={<Brain className="h-4 w-4" />}>
                                {/* Provider Selection */}
                                <div className="space-y-2 mb-4">
                                    {AI_PROVIDERS.map((provider) => (
                                        <button
                                            key={provider.id}
                                            onClick={() => updateSetting('aiProvider', provider.id)}
                                            className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-all ${settings.aiProvider === provider.id
                                                    ? 'border-primary bg-primary/10'
                                                    : 'border-border hover:border-muted-foreground/50'
                                                }`}
                                        >
                                            <span className="text-2xl">{provider.icon}</span>
                                            <div className="text-left flex-1">
                                                <p className="font-medium text-sm">{provider.name}</p>
                                                <p className="text-xs text-muted-foreground">{provider.description}</p>
                                            </div>
                                            {settings.aiProvider === provider.id && (
                                                <Check className="h-4 w-4 text-primary" />
                                            )}
                                        </button>
                                    ))}
                                </div>

                                {/* Ollama Settings */}
                                {settings.aiProvider === 'ollama' && (
                                    <div className="space-y-3 border-t border-border pt-3">
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
                                    </div>
                                )}

                                {/* OpenAI Settings */}
                                {settings.aiProvider === 'openai' && (
                                    <div className="space-y-3 border-t border-border pt-3">
                                        <div>
                                            <label className="text-sm text-muted-foreground flex items-center gap-2 mb-2">
                                                <Key className="h-3 w-3" />
                                                API Key
                                            </label>
                                            <div className="relative">
                                                <input
                                                    type={showApiKey ? 'text' : 'password'}
                                                    value={settings.openaiApiKey}
                                                    onChange={(e) => updateSetting('openaiApiKey', e.target.value)}
                                                    placeholder="sk-..."
                                                    className="w-full rounded-md border border-input bg-background px-3 py-2 pr-10 text-sm font-mono"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowApiKey(!showApiKey)}
                                                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                                >
                                                    {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                                </button>
                                            </div>
                                            <p className="mt-1 text-xs text-muted-foreground">
                                                Get your API key from <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-primary underline">OpenAI Dashboard</a>
                                            </p>
                                        </div>
                                        <SettingsRow label="Model">
                                            <select
                                                value={settings.openaiModel || 'gpt-4o'}
                                                onChange={(e) => updateSetting('openaiModel' as any, e.target.value)}
                                                className="rounded-md border border-input bg-background px-3 py-1.5 text-sm"
                                            >
                                                {OPENAI_MODELS.map((model) => (
                                                    <option key={model.id} value={model.id}>
                                                        {model.name}
                                                    </option>
                                                ))}
                                            </select>
                                        </SettingsRow>
                                    </div>
                                )}

                                {/* Anthropic Settings */}
                                {settings.aiProvider === 'anthropic' && (
                                    <div className="space-y-3 border-t border-border pt-3">
                                        <div>
                                            <label className="text-sm text-muted-foreground flex items-center gap-2 mb-2">
                                                <Key className="h-3 w-3" />
                                                API Key
                                            </label>
                                            <div className="relative">
                                                <input
                                                    type={showApiKey ? 'text' : 'password'}
                                                    value={settings.anthropicApiKey}
                                                    onChange={(e) => updateSetting('anthropicApiKey', e.target.value)}
                                                    placeholder="sk-ant-..."
                                                    className="w-full rounded-md border border-input bg-background px-3 py-2 pr-10 text-sm font-mono"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowApiKey(!showApiKey)}
                                                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                                >
                                                    {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                                </button>
                                            </div>
                                            <p className="mt-1 text-xs text-muted-foreground">
                                                Get your API key from <a href="https://console.anthropic.com/account/keys" target="_blank" rel="noopener noreferrer" className="text-primary underline">Anthropic Console</a>
                                            </p>
                                        </div>
                                        <SettingsRow label="Model">
                                            <select
                                                value={settings.anthropicModel || 'claude-3-sonnet-20240229'}
                                                onChange={(e) => updateSetting('anthropicModel' as any, e.target.value)}
                                                className="rounded-md border border-input bg-background px-3 py-1.5 text-sm"
                                            >
                                                {ANTHROPIC_MODELS.map((model) => (
                                                    <option key={model.id} value={model.id}>
                                                        {model.name}
                                                    </option>
                                                ))}
                                            </select>
                                        </SettingsRow>
                                    </div>
                                )}

                                {/* Test Connection */}
                                <div className="mt-4 flex items-center gap-3">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={testConnection}
                                        disabled={testingConnection}
                                        className="gap-2"
                                    >
                                        {testingConnection ? (
                                            <span className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                        ) : (
                                            <Server className="h-4 w-4" />
                                        )}
                                        Test Connection
                                    </Button>
                                    {connectionStatus === 'success' && (
                                        <span className="flex items-center gap-1 text-sm text-green-500">
                                            <Check className="h-4 w-4" /> Connected
                                        </span>
                                    )}
                                    {connectionStatus === 'error' && (
                                        <span className="flex items-center gap-1 text-sm text-red-500">
                                            <AlertCircle className="h-4 w-4" /> Failed
                                        </span>
                                    )}
                                </div>
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

function Toggle({ checked, onChange }: { checked: boolean; onChange: (value: boolean) => void }) {
    return (
        <label className="relative inline-flex cursor-pointer items-center">
            <input
                type="checkbox"
                checked={checked}
                onChange={(e) => onChange(e.target.checked)}
                className="peer sr-only"
            />
            <div className="h-5 w-9 rounded-full bg-muted peer-checked:bg-primary peer-focus:ring-2 peer-focus:ring-ring after:absolute after:left-[2px] after:top-[2px] after:h-4 after:w-4 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:after:translate-x-full" />
        </label>
    );
}
