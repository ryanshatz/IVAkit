'use client';

import dynamic from 'next/dynamic';
import { Provider } from 'jotai';

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
            <StudioLayout />
        </Provider>
    );
}

function StudioLoading() {
    return (
        <div className="flex h-screen w-full items-center justify-center bg-background">
            <div className="flex flex-col items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 via-cyan-500 to-purple-600 animate-pulse">
                    <span className="text-2xl font-bold text-white">I</span>
                </div>
                <div className="flex flex-col items-center gap-2">
                    <p className="text-lg font-semibold">IVAkit Studio</p>
                    <p className="text-sm text-muted-foreground">Loading flow builder...</p>
                </div>
                <div className="h-1 w-32 overflow-hidden rounded-full bg-muted">
                    <div
                        className="h-full w-1/3 bg-primary rounded-full animate-[loading_1s_ease-in-out_infinite]"
                    />
                </div>
            </div>
        </div>
    );
}
