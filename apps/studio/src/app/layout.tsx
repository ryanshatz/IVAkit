import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { ThemeProvider } from '@/components/providers/theme-provider';
import { Toaster } from '@/components/ui/toaster';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
    title: 'IVAkit Studio - Visual IVA Builder',
    description: 'Build, test, and deploy AI-powered Intelligent Virtual Agents without code',
    keywords: ['IVA', 'chatbot', 'contact center', 'AI', 'no-code', 'conversation builder'],
    authors: [{ name: 'IVAkit Contributors' }],
    openGraph: {
        title: 'IVAkit Studio',
        description: 'Open-source no-code AI Virtual Agent builder',
        type: 'website',
    },
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en" suppressHydrationWarning>
            <body className={inter.className}>
                <ThemeProvider
                    attribute="class"
                    defaultTheme="dark"
                    enableSystem
                    disableTransitionOnChange
                >
                    {children}
                    <Toaster />
                </ThemeProvider>
            </body>
        </html>
    );
}
