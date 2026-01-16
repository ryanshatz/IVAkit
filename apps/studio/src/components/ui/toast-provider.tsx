'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
    id: string;
    type: ToastType;
    title: string;
    description?: string;
    duration?: number;
}

interface ToastContextType {
    toasts: Toast[];
    addToast: (toast: Omit<Toast, 'id'>) => void;
    removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export function useToast() {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within ToastProvider');
    }
    return context;
}

export function ToastProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
        const id = `toast_${Date.now()}`;
        const newToast = { ...toast, id };

        setToasts(prev => [...prev, newToast]);

        // Auto-remove after duration
        const duration = toast.duration ?? 5000;
        if (duration > 0) {
            setTimeout(() => {
                setToasts(prev => prev.filter(t => t.id !== id));
            }, duration);
        }
    }, []);

    const removeToast = useCallback((id: string) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    return (
        <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
            {children}
            <ToastContainer toasts={toasts} removeToast={removeToast} />
        </ToastContext.Provider>
    );
}

function ToastContainer({ toasts, removeToast }: { toasts: Toast[]; removeToast: (id: string) => void }) {
    return (
        <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2">
            <AnimatePresence mode="popLayout">
                {toasts.map(toast => (
                    <ToastItem key={toast.id} toast={toast} onClose={() => removeToast(toast.id)} />
                ))}
            </AnimatePresence>
        </div>
    );
}

function ToastItem({ toast, onClose }: { toast: Toast; onClose: () => void }) {
    const icons = {
        success: <CheckCircle className="h-5 w-5 text-green-500" />,
        error: <AlertCircle className="h-5 w-5 text-red-500" />,
        warning: <AlertTriangle className="h-5 w-5 text-amber-500" />,
        info: <Info className="h-5 w-5 text-blue-500" />,
    };

    const bgColors = {
        success: 'border-green-500/20 bg-green-500/10',
        error: 'border-red-500/20 bg-red-500/10',
        warning: 'border-amber-500/20 bg-amber-500/10',
        info: 'border-blue-500/20 bg-blue-500/10',
    };

    return (
        <motion.div
            layout
            initial={{ opacity: 0, x: 100, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 100, scale: 0.9 }}
            transition={{ type: 'spring', duration: 0.3 }}
            className={`flex w-80 items-start gap-3 rounded-lg border p-4 shadow-lg backdrop-blur-sm ${bgColors[toast.type]}`}
        >
            <div className="shrink-0">{icons[toast.type]}</div>
            <div className="flex-1 min-w-0">
                <p className="font-medium text-sm">{toast.title}</p>
                {toast.description && (
                    <p className="mt-1 text-xs text-muted-foreground">{toast.description}</p>
                )}
            </div>
            <button
                onClick={onClose}
                className="shrink-0 rounded p-1 hover:bg-background/50 transition-colors"
            >
                <X className="h-4 w-4 text-muted-foreground" />
            </button>
        </motion.div>
    );
}

// Convenience hooks for common toast types
export function useSuccessToast() {
    const { addToast } = useToast();
    return useCallback((title: string, description?: string) => {
        addToast({ type: 'success', title, description });
    }, [addToast]);
}

export function useErrorToast() {
    const { addToast } = useToast();
    return useCallback((title: string, description?: string) => {
        addToast({ type: 'error', title, description });
    }, [addToast]);
}

export function useWarningToast() {
    const { addToast } = useToast();
    return useCallback((title: string, description?: string) => {
        addToast({ type: 'warning', title, description });
    }, [addToast]);
}

export function useInfoToast() {
    const { addToast } = useToast();
    return useCallback((title: string, description?: string) => {
        addToast({ type: 'info', title, description });
    }, [addToast]);
}
