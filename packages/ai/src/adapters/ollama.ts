/**
 * Ollama Adapter
 * 
 * Local-first LLM integration via Ollama.
 */

import type { AIAdapter, ClassifyOptions, ClassifyResult, GenerateOptions, GenerateResult } from '../types';

const DEFAULT_OLLAMA_URL = 'http://localhost:11434';
const DEFAULT_MODEL = 'llama3.2';

export class OllamaAdapter implements AIAdapter {
    private baseUrl: string;
    private defaultModel: string;

    constructor(baseUrl?: string, defaultModel?: string) {
        this.baseUrl = baseUrl || process.env.OLLAMA_URL || DEFAULT_OLLAMA_URL;
        this.defaultModel = defaultModel || process.env.OLLAMA_MODEL || DEFAULT_MODEL;
    }

    async classify(options: ClassifyOptions): Promise<ClassifyResult> {
        const model = options.model?.model || this.defaultModel;

        const intentList = options.intents
            .map(i => `- ${i.name}: ${i.description}`)
            .join('\n');

        const prompt = `${options.systemPrompt}

Available intents:
${intentList}

User message: "${options.userMessage}"

Respond with a JSON object containing:
- "intent": the name of the matched intent (must be one from the list above)
- "confidence": a number between 0 and 1 indicating confidence
- "reasoning": brief explanation of why this intent was chosen

JSON Response:`;

        try {
            const response = await fetch(`${this.baseUrl}/api/generate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model,
                    prompt,
                    format: 'json',
                    stream: false,
                    options: {
                        temperature: options.model?.temperature ?? 0.3,
                    },
                }),
            });

            if (!response.ok) {
                throw new Error(`Ollama API error: ${response.status}`);
            }

            const data = await response.json();
            const result = JSON.parse(data.response);

            return {
                intent: result.intent || options.intents[0]?.name || 'unknown',
                confidence: Math.min(1, Math.max(0, result.confidence || 0.5)),
                reasoning: result.reasoning,
            };
        } catch (error) {
            console.error('Ollama classify error:', error);
            // Return fallback
            return {
                intent: options.intents[0]?.name || 'unknown',
                confidence: 0.1,
                reasoning: 'Classification failed, using fallback',
            };
        }
    }

    async generate(options: GenerateOptions): Promise<GenerateResult> {
        const model = options.model?.model || this.defaultModel;

        let prompt = `${options.systemPrompt}\n\nUser: ${options.userMessage}`;

        if (options.schema) {
            prompt += `\n\nRespond with a JSON object matching this schema: ${JSON.stringify(options.schema)}`;
        }

        try {
            const response = await fetch(`${this.baseUrl}/api/generate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model,
                    prompt,
                    format: options.schema ? 'json' : undefined,
                    stream: false,
                    options: {
                        temperature: options.model?.temperature ?? 0.7,
                        num_predict: options.model?.maxTokens ?? 500,
                    },
                }),
            });

            if (!response.ok) {
                throw new Error(`Ollama API error: ${response.status}`);
            }

            const data = await response.json();

            let structured: unknown;
            if (options.schema) {
                try {
                    structured = JSON.parse(data.response);
                } catch {
                    structured = undefined;
                }
            }

            return {
                response: data.response,
                structured,
                tokens: {
                    input: data.prompt_eval_count || 0,
                    output: data.eval_count || 0,
                },
            };
        } catch (error) {
            console.error('Ollama generate error:', error);
            throw error;
        }
    }

    /**
     * Check if Ollama is available
     */
    async isAvailable(): Promise<boolean> {
        try {
            const response = await fetch(`${this.baseUrl}/api/tags`);
            return response.ok;
        } catch {
            return false;
        }
    }

    /**
     * List available models
     */
    async listModels(): Promise<string[]> {
        try {
            const response = await fetch(`${this.baseUrl}/api/tags`);
            const data = await response.json();
            return data.models?.map((m: { name: string }) => m.name) || [];
        } catch {
            return [];
        }
    }
}
