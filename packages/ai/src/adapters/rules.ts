/**
 * Rules-based Adapter (Fallback)
 * 
 * Simple keyword-based classification when LLMs are unavailable.
 * This provides a deterministic, no-AI fallback mode.
 */

import type { AIAdapter, ClassifyOptions, ClassifyResult, GenerateOptions, GenerateResult } from '../types';

export class RulesAdapter implements AIAdapter {
    async classify(options: ClassifyOptions): Promise<ClassifyResult> {
        const message = options.userMessage.toLowerCase();

        // Simple keyword matching
        for (const intent of options.intents) {
            const keywords = this.extractKeywords(intent.name, intent.description);
            const matchCount = keywords.filter(keyword => message.includes(keyword)).length;

            if (matchCount > 0) {
                return {
                    intent: intent.name,
                    confidence: Math.min(0.8, matchCount * 0.2),
                    reasoning: `Matched keywords: ${keywords.filter(k => message.includes(k)).join(', ')}`,
                };
            }
        }

        // No match - return first intent as fallback
        return {
            intent: options.intents[0]?.name || 'unknown',
            confidence: 0.1,
            reasoning: 'No keyword matches found, using fallback',
        };
    }

    async generate(options: GenerateOptions): Promise<GenerateResult> {
        // Rules adapter can't generate - return a default message
        return {
            response: "I'm unable to process that request at the moment. Please try again later or contact support.",
            tokens: { input: 0, output: 0 },
        };
    }

    private extractKeywords(name: string, description: string): string[] {
        const text = `${name} ${description}`.toLowerCase();

        // Remove common words and extract meaningful keywords
        const stopWords = ['a', 'an', 'the', 'is', 'are', 'to', 'for', 'of', 'and', 'or', 'in', 'on', 'at', 'by'];
        const words = text.split(/\W+/).filter(w => w.length > 2 && !stopWords.includes(w));

        // Also add the intent name variations
        const nameVariations = name.split('_').filter(w => w.length > 2);

        return [...new Set([...words, ...nameVariations])];
    }
}
