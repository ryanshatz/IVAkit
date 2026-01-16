/**
 * IVAkit AI Module
 * 
 * Local-first AI integration with support for:
 * - Ollama (local, default)
 * - OpenAI (optional cloud)
 * - Anthropic (optional cloud)
 * - Rules-based fallback
 */

export { createAIService } from './service';
export { OllamaAdapter } from './adapters/ollama';
export { OpenAIAdapter } from './adapters/openai';
export { AnthropicAdapter } from './adapters/anthropic';
export { RulesAdapter } from './adapters/rules';
export type { AIAdapter, AIConfig } from './types';
