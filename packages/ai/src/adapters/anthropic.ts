/**
 * Anthropic Adapter (Optional Cloud)
 */

import type { AIAdapter, ClassifyOptions, ClassifyResult, GenerateOptions, GenerateResult } from '../types';

export class AnthropicAdapter implements AIAdapter {
    private apiKey: string;
    private baseUrl: string;
    private defaultModel: string;

    constructor(apiKey?: string, baseUrl?: string, defaultModel?: string) {
        this.apiKey = apiKey || process.env.ANTHROPIC_API_KEY || '';
        this.baseUrl = baseUrl || 'https://api.anthropic.com/v1';
        this.defaultModel = defaultModel || 'claude-3-sonnet-20240229';
    }

    async classify(options: ClassifyOptions): Promise<ClassifyResult> {
        if (!this.apiKey) {
            throw new Error('Anthropic API key not configured');
        }

        const model = options.model?.model || this.defaultModel;

        const intentList = options.intents
            .map(i => `- ${i.name}: ${i.description}`)
            .join('\n');

        const response = await fetch(`${this.baseUrl}/messages`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': this.apiKey,
                'anthropic-version': '2023-06-01',
            },
            body: JSON.stringify({
                model,
                max_tokens: 500,
                system: `${options.systemPrompt}\n\nAvailable intents:\n${intentList}\n\nRespond with only valid JSON containing "intent", "confidence", and "reasoning".`,
                messages: [
                    {
                        role: 'user',
                        content: options.userMessage,
                    },
                ],
                temperature: options.model?.temperature ?? 0.3,
            }),
        });

        if (!response.ok) {
            throw new Error(`Anthropic API error: ${response.status}`);
        }

        const data = await response.json();
        const content = data.content[0].text;
        const result = JSON.parse(content);

        return {
            intent: result.intent,
            confidence: result.confidence || 0.8,
            reasoning: result.reasoning,
        };
    }

    async generate(options: GenerateOptions): Promise<GenerateResult> {
        if (!this.apiKey) {
            throw new Error('Anthropic API key not configured');
        }

        const model = options.model?.model || this.defaultModel;

        const response = await fetch(`${this.baseUrl}/messages`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': this.apiKey,
                'anthropic-version': '2023-06-01',
            },
            body: JSON.stringify({
                model,
                max_tokens: options.model?.maxTokens ?? 500,
                system: options.systemPrompt,
                messages: [
                    { role: 'user', content: options.userMessage },
                ],
                temperature: options.model?.temperature ?? 0.7,
            }),
        });

        if (!response.ok) {
            throw new Error(`Anthropic API error: ${response.status}`);
        }

        const data = await response.json();
        const content = data.content[0].text;

        let structured: unknown;
        if (options.schema) {
            try {
                structured = JSON.parse(content);
            } catch {
                structured = undefined;
            }
        }

        return {
            response: content,
            structured,
            tokens: {
                input: data.usage?.input_tokens || 0,
                output: data.usage?.output_tokens || 0,
            },
        };
    }
}
