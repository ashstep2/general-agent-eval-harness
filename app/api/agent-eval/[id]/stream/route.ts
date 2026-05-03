import { NextRequest } from 'next/server';
import { getAgentEvaluationConfig } from '@/lib/agent-eval/config-store';
import { getAgentTask } from '@/lib/agent-eval/tasks';
import { runAgentEvaluation } from '@/lib/agent-eval/runner';
import { checkRateLimit, clientKeyFromHeaders } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

// Rate limit on the streaming start. Each successful start kicks off a real
// model run that can take minutes and cost dollars.
const RATE_LIMIT = { max: 5, windowMs: 60_000 };

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: evaluationId } = await params;
  const encoder = new TextEncoder();

  const key = clientKeyFromHeaders(request.headers);
  const limit = checkRateLimit(key, RATE_LIMIT);
  if (!limit.allowed) {
    return new Response(
      JSON.stringify({ error: 'Rate limit exceeded. Try again shortly.' }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': Math.ceil(limit.retryAfterMs / 1000).toString(),
        },
      },
    );
  }

  let config = getAgentEvaluationConfig(evaluationId);

  if (!config) {
    const url = new URL(request.url);
    const taskId = url.searchParams.get('taskId');
    const modelsParam = url.searchParams.get('models');
    const mode = url.searchParams.get('mode');
    const weightPreset = url.searchParams.get('weightPreset');
    const customWeightsParam = url.searchParams.get('customWeights');

    if (taskId && modelsParam && mode && weightPreset) {
      const customWeights = customWeightsParam
        ? (JSON.parse(customWeightsParam) as Record<string, number>)
        : undefined;
      config = {
        taskId,
        models: modelsParam.split(','),
        mode: mode as 'single_shot' | 'agent_loop',
        weightPreset: weightPreset as 'developer_trust' | 'ship_fast' | 'custom',
        customWeights,
        startedAt: new Date().toISOString(),
      };
    } else {
      return new Response(
        JSON.stringify({ error: 'Evaluation not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }
  }

  const task = getAgentTask(config.taskId);
  if (!task) {
    return new Response(
      JSON.stringify({ error: 'Task not found' }),
      { status: 404, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const stream = new ReadableStream({
    async start(controller) {
      try {
        for await (const event of runAgentEvaluation(
          task,
          config.models,
          config.mode,
          config.weightPreset,
          config.customWeights
        )) {
          const data = `data: ${JSON.stringify(event)}\n\n`;
          controller.enqueue(encoder.encode(data));
        }
      } catch (error) {
        const errorEvent = {
          type: 'error',
          data: {
            message: error instanceof Error ? error.message : 'Unknown error',
          },
        };
        const data = `data: ${JSON.stringify(errorEvent)}\n\n`;
        controller.enqueue(encoder.encode(data));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}
