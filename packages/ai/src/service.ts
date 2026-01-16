/**
 * AI Service Factory
 * 
 * Creates the appropriate AI adapter based on configuration.
 */

import type { AIAdapter, AIConfig } from './types';
import { OllamaAdapter } from './adapters/ollama';
import { OpenAIAdapter } from './adapters/openai';
import { AnthropicAdapter } from './adapters/anthropic';
import { RulesAdapter } from './adapters/rules';

export function createAIService(config?: Partial<AIConfig>): AIAdapter {
    const provider = config?.provider || process.env.AI_PROVIDER || 'ollama';

    switch (provider) {
        case 'ollama':
            return new OllamaAdapter(config?.baseUrl, config?.model);

        case 'openai':
            return new OpenAIAdapter(config?.apiKey, config?.baseUrl, config?.model);

        case 'anthropic':
            return new AnthropicAdapter(config?.apiKey, config?.baseUrl, config?.model);

        case 'rules':
            return new RulesAdapter();

        default:
            console.warn(`Unknown AI provider: ${provider}, falling back to rules-based`);
            return new RulesAdapter();
    }
}
