/**
 * OpenAI Adapter (Optional Cloud)
 */

import type { AIAdapter, ClassifyOptions, ClassifyResult, GenerateOptions, GenerateResult } from '../types';

export class OpenAIAdapter implements AIAdapter {
    private apiKey: string;
    private baseUrl: string;
    private defaultModel: string;

    constructor(apiKey?: string, baseUrl?: string, defaultModel?: string) {
        this.apiKey = apiKey || process.env.OPENAI_API_KEY || '';
        this.baseUrl = baseUrl || 'https://api.openai.com/v1';
        this.defaultModel = defaultModel || 'gpt-4-turbo-preview';
    }

    async classify(options: ClassifyOptions): Promise<ClassifyResult> {
        if (!this.apiKey) {
            throw new Error('OpenAI API key not configured');
        }

        const model = options.model?.model || this.defaultModel;

        const intentList = options.intents
            .map(i => `- ${i.name}: ${i.description}`)
            .join('\n');

        const response = await fetch(`${this.baseUrl}/chat/completions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.apiKey}`,
            },
            body: JSON.stringify({
                model,
                messages: [
                    {
                        role: 'system',
                        content: `${options.systemPrompt}\n\nAvailable intents:\n${intentList}`,
                    },
                    {
                        role: 'user',
                        content: options.userMessage,
                    },
                ],
                response_format: { type: 'json_object' },
                temperature: options.model?.temperature ?? 0.3,
            }),
        });

        if (!response.ok) {
            throw new Error(`OpenAI API error: ${response.status}`);
        }

        const data = await response.json();
        const result = JSON.parse(data.choices[0].message.content);

        return {
            intent: result.intent,
            confidence: result.confidence || 0.8,
            reasoning: result.reasoning,
        };
    }

    async generate(options: GenerateOptions): Promise<GenerateResult> {
        if (!this.apiKey) {
            throw new Error('OpenAI API key not configured');
        }

        const model = options.model?.model || this.defaultModel;

        const response = await fetch(`${this.baseUrl}/chat/completions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.apiKey}`,
            },
            body: JSON.stringify({
                model,
                messages: [
                    { role: 'system', content: options.systemPrompt },
                    { role: 'user', content: options.userMessage },
                ],
                response_format: options.schema ? { type: 'json_object' } : undefined,
                temperature: options.model?.temperature ?? 0.7,
                max_tokens: options.model?.maxTokens ?? 500,
            }),
        });

        if (!response.ok) {
            throw new Error(`OpenAI API error: ${response.status}`);
        }

        const data = await response.json();
        const content = data.choices[0].message.content;

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
                input: data.usage?.prompt_tokens || 0,
                output: data.usage?.completion_tokens || 0,
            },
        };
    }
}
