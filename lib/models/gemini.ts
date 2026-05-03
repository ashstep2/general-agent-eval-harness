import { GoogleGenerativeAI } from '@google/generative-ai';
import { ModelResponse } from '@/types';

let client: GoogleGenerativeAI | null = null;

function getClient(): GoogleGenerativeAI {
  if (!client) {
    client = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || '');
  }
  return client;
}

export async function queryGemini(
  modelId: string,
  prompt: string,
  systemPrompt?: string
): Promise<ModelResponse> {
  const genAI = getClient();
  const startTime = Date.now();

  try {
    const model = genAI.getGenerativeModel({
      model: modelId,
      systemInstruction: systemPrompt || undefined,
    });

    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: { maxOutputTokens: 8192 },
    });

    const latencyMs = Date.now() - startTime;
    const response = result.response.text();

    console.log(`[Gemini] ${modelId} response:`, {
      contentLength: response.length,
      contentPreview: response.slice(0, 100),
    });

    return { modelId, response, latencyMs };
  } catch (error) {
    const latencyMs = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[Gemini] Error querying ${modelId}:`, errorMessage);
    return { modelId, response: '', latencyMs, error: errorMessage };
  }
}

export async function* streamGemini(
  modelId: string,
  prompt: string,
  systemPrompt?: string
): AsyncGenerator<{ text: string; done: boolean }> {
  const genAI = getClient();

  const model = genAI.getGenerativeModel({
    model: modelId,
    systemInstruction: systemPrompt || undefined,
  });

  const result = await model.generateContentStream({
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: { maxOutputTokens: 8192 },
  });

  for await (const chunk of result.stream) {
    const text = chunk.text();
    if (text) {
      yield { text, done: false };
    }
  }

  yield { text: '', done: true };
}
