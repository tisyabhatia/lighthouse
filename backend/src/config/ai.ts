import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { env } from './env';
import { logger } from '../lib/logger';

// OpenAI client
export const openaiClient = env.OPENAI_API_KEY
  ? new OpenAI({
      apiKey: env.OPENAI_API_KEY,
    })
  : null;

// Anthropic client
export const anthropicClient = env.ANTHROPIC_API_KEY
  ? new Anthropic({
      apiKey: env.ANTHROPIC_API_KEY,
    })
  : null;

// AI Configuration
export const aiConfig = {
  provider: env.AI_PROVIDER,
  model: env.AI_MODEL,
  maxTokens: env.AI_MAX_TOKENS,
  temperature: env.AI_TEMPERATURE,
  batchSize: env.AI_BATCH_SIZE,
  rateLimitPerMinute: env.AI_RATE_LIMIT_PER_MINUTE,
};

// Validate AI configuration
export function validateAIConfig(): boolean {
  if (env.AI_PROVIDER === 'openai' && !env.OPENAI_API_KEY) {
    logger.warn('⚠️  OpenAI API key not configured');
    return false;
  }

  if (env.AI_PROVIDER === 'anthropic' && !env.ANTHROPIC_API_KEY) {
    logger.warn('⚠️  Anthropic API key not configured');
    return false;
  }

  logger.info(`✅ AI provider configured: ${env.AI_PROVIDER}`);
  return true;
}

// Generic AI completion interface
export interface AICompletionRequest {
  prompt: string;
  systemPrompt?: string;
  maxTokens?: number;
  temperature?: number;
}

export interface AICompletionResponse {
  content: string;
  tokensUsed: number;
  model: string;
}

// Generic AI completion function
export async function getAICompletion(
  request: AICompletionRequest
): Promise<AICompletionResponse> {
  try {
    if (env.AI_PROVIDER === 'openai' && openaiClient) {
      const response = await openaiClient.chat.completions.create({
        model: aiConfig.model,
        messages: [
          ...(request.systemPrompt
            ? [{ role: 'system' as const, content: request.systemPrompt }]
            : []),
          { role: 'user' as const, content: request.prompt },
        ],
        max_tokens: request.maxTokens || aiConfig.maxTokens,
        temperature: request.temperature || aiConfig.temperature,
      });

      return {
        content: response.choices[0]?.message?.content || '',
        tokensUsed: response.usage?.total_tokens || 0,
        model: response.model,
      };
    } else if (env.AI_PROVIDER === 'anthropic' && anthropicClient) {
      const response = await anthropicClient.messages.create({
        model: aiConfig.model,
        max_tokens: request.maxTokens || aiConfig.maxTokens,
        temperature: request.temperature || aiConfig.temperature,
        system: request.systemPrompt,
        messages: [{ role: 'user', content: request.prompt }],
      });

      const content =
        response.content[0]?.type === 'text' ? response.content[0].text : '';

      return {
        content,
        tokensUsed: response.usage.input_tokens + response.usage.output_tokens,
        model: response.model,
      };
    }

    throw new Error('No AI provider configured');
  } catch (error) {
    logger.error('AI completion error:', error);
    throw error;
  }
}
