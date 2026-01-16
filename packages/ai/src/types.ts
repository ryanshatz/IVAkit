/**
 * AI Types
 */

export interface AIConfig {
    provider: 'ollama' | 'openai' | 'anthropic' | 'rules';
    model?: string;
    temperature?: number;
    maxTokens?: number;
    apiKey?: string;
    baseUrl?: string;
}

export interface ClassifyOptions {
    systemPrompt: string;
    userMessage: string;
    intents: Array<{ name: string; description: string }>;
    model?: AIConfig;
}

export interface ClassifyResult {
    intent: string;
    confidence: number;
    reasoning?: string;
}

export interface GenerateOptions {
    systemPrompt: string;
    userMessage: string;
    model?: AIConfig;
    schema?: Record<string, unknown>;
}

export interface GenerateResult {
    response: string;
    structured?: unknown;
    tokens: { input: number; output: number };
}

export interface AIAdapter {
    classify(options: ClassifyOptions): Promise<ClassifyResult>;
    generate(options: GenerateOptions): Promise<GenerateResult>;
}
