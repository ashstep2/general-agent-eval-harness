import { ModelConfig } from '@/types';

export const MODELS: ModelConfig[] = [
  {
    provider: 'openai',
    modelId: 'gpt-5.5',
    displayName: 'GPT-5.5',
    description: "OpenAI's newest frontier model -- absorbs the Codex line",
  },
  {
    provider: 'openai',
    modelId: 'gpt-5.4',
    displayName: 'GPT-5.4',
    description: 'Previous-gen OpenAI flagship',
  },
  {
    provider: 'openai',
    modelId: 'gpt-5.3-codex',
    displayName: 'GPT-5.3 Codex',
    description: 'Previous-gen coding-optimized variant -- requires local Codex CLI',
    type: 'cli',
  },
  {
    provider: 'openai',
    modelId: 'gpt-5.2',
    displayName: 'GPT-5.2',
    description: 'Earlier-gen OpenAI flagship',
  },
  {
    provider: 'openai',
    modelId: 'gpt-5-mini',
    displayName: 'GPT-5 Mini',
    description: 'Balanced performance and speed',
  },
  {
    provider: 'openai',
    modelId: 'gpt-5-nano',
    displayName: 'GPT-5 Nano',
    description: 'Fastest, lowest cost',
  },
  {
    provider: 'anthropic',
    modelId: 'claude-opus-4-7',
    displayName: 'Claude Opus 4.7',
    description: "Anthropic's most capable model",
  },
  {
    provider: 'anthropic',
    modelId: 'claude-opus-4-6',
    displayName: 'Claude Opus 4.6',
    description: 'Previous-gen Opus flagship',
  },
  {
    provider: 'anthropic',
    modelId: 'claude-sonnet-4-6',
    displayName: 'Claude Sonnet 4.6',
    description: 'Opus-level intelligence at Sonnet pricing',
  },
  {
    provider: 'anthropic',
    modelId: 'claude-opus-4-5-20251101',
    displayName: 'Claude Opus 4.5',
    description: 'Earlier-gen Opus model',
  },
  {
    provider: 'anthropic',
    modelId: 'claude-sonnet-4-20250514',
    displayName: 'Claude Sonnet 4',
    description: 'Balance of speed and capability',
  },
  {
    provider: 'anthropic',
    modelId: 'claude-haiku-4-5-20251001',
    displayName: 'Claude Haiku 4.5',
    description: 'Fastest Claude model with extended thinking',
  },
  {
    provider: 'google',
    modelId: 'gemini-2.5-pro',
    displayName: 'Gemini 2.5 Pro',
    description: 'Google deep reasoning model, 1M context',
  },
  {
    provider: 'google',
    modelId: 'gemini-2.5-flash',
    displayName: 'Gemini 2.5 Flash',
    description: 'Fast and cost-efficient Gemini model',
  },
  {
    provider: 'google',
    modelId: 'gemini-3.1-pro-preview',
    displayName: 'Gemini 3.1 Pro (Preview)',
    description: 'Latest Gemini preview -- may change before GA',
  },
];

export const MODEL_MAP: Record<string, ModelConfig> = MODELS.reduce(
  (acc, model) => {
    acc[model.modelId] = model;
    return acc;
  },
  {} as Record<string, ModelConfig>
);

export function getModelConfig(modelId: string): ModelConfig | undefined {
  return MODEL_MAP[modelId];
}

export function getModelDisplayName(modelId: string): string {
  return MODEL_MAP[modelId]?.displayName || modelId;
}

export function getModelsByProvider(provider: 'anthropic' | 'openai' | 'google'): ModelConfig[] {
  return MODELS.filter((m) => m.provider === provider);
}
