'use client';

import dynamic from 'next/dynamic';
import { Provider } from 'jotai';
import { ToastProvider } from '@/components/ui/toast-provider';

// Dynamic import to prevent SSR hydration issues with React Flow
const StudioLayout = dynamic(
    () => import('@/components/studio/studio-layout').then(mod => ({ default: mod.StudioLayout })),
    {
        ssr: false,
        loading: () => <StudioLoading />
    }
);

export default function HomePage() {
    return (
        <Provider>
            <ToastProvider>
                <StudioLayout />
            </ToastProvider>
        </Provider>
    );
}

function StudioLoading() {
    return (
        <div className="flex h-screen w-full items-center justify-center bg-background">
            <div className="flex flex-col items-center gap-6">
                {/* Animated Logo */}
                <div className="relative">
                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-blue-500 via-cyan-500 to-purple-600 blur-xl opacity-50 animate-pulse" />
                    <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 via-cyan-500 to-purple-600 shadow-2xl">
                        <span className="text-3xl font-bold text-white">I</span>
                    </div>
                </div>

                {/* Title */}
                <div className="flex flex-col items-center gap-2">
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">
                        IVAkit Studio
                    </h1>
                    <p className="text-sm text-muted-foreground">Loading visual flow builder...</p>
                </div>

                {/* Loading Bar */}
                <div className="h-1 w-48 overflow-hidden rounded-full bg-muted">
                    <div className="h-full w-full bg-gradient-to-r from-blue-500 to-purple-600 rounded-full animate-loading-bar" />
                </div>

                {/* Tips */}
                <div className="mt-4 max-w-xs text-center text-xs text-muted-foreground">
                    <p>💡 <strong>Tip:</strong> Press <kbd className="rounded bg-muted px-1.5 py-0.5">?</kbd> anytime to view keyboard shortcuts</p>
                </div>
            </div>

            <style jsx>{`
                @keyframes loading-bar {
                    0% { transform: translateX(-100%); }
                    100% { transform: translateX(100%); }
                }
                .animate-loading-bar {
                    animation: loading-bar 1.5s ease-in-out infinite;
                }
            `}</style>
        </div>
    );
}
