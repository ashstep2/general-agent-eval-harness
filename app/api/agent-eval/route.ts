import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { getAgentTask } from '@/lib/agent-eval/tasks';
import { getModelConfig } from '@/lib/data/models';
import { setAgentEvaluationConfig } from '@/lib/agent-eval/config-store';
import { checkRateLimit, clientKeyFromHeaders } from '@/lib/rate-limit';
import { AgentEvalMode, WeightPreset } from '@/types';

// Rate limit: 5 evaluation kicks per IP per minute. Eval runs cost real money;
// without this, the public endpoint is a DoS vector for the project's API balance.
const RATE_LIMIT = { max: 5, windowMs: 60_000 };

export async function POST(request: NextRequest) {
  const key = clientKeyFromHeaders(request.headers);
  const limit = checkRateLimit(key, RATE_LIMIT);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: 'Rate limit exceeded. Try again shortly.' },
      {
        status: 429,
        headers: {
          'Retry-After': Math.ceil(limit.retryAfterMs / 1000).toString(),
          'X-RateLimit-Remaining': '0',
        },
      },
    );
  }

  try {
    const body = await request.json();
    const { taskId, models, mode, weightPreset, customWeights } = body as {
      taskId: string;
      models: string[];
      mode: AgentEvalMode;
      weightPreset: WeightPreset;
      customWeights?: Record<string, number>;
    };

    const task = getAgentTask(taskId);
    if (!task) {
      return NextResponse.json(
        { error: `Invalid task: ${taskId}` },
        { status: 400 }
      );
    }

    if (!Array.isArray(models) || models.length === 0 || models.length > 3) {
      return NextResponse.json(
        { error: 'Select 1-3 models to compare' },
        { status: 400 }
      );
    }

    for (const modelId of models) {
      const config = getModelConfig(modelId);
      if (!config) {
        return NextResponse.json(
          { error: `Invalid model: ${modelId}` },
          { status: 400 }
        );
      }
    }

    const evaluationId = uuidv4();

    setAgentEvaluationConfig(evaluationId, {
      taskId,
      models,
      mode,
      weightPreset,
      customWeights,
      startedAt: new Date().toISOString(),
    });

    return NextResponse.json({ evaluationId });
  } catch (error) {
    console.error('Error starting agent evaluation:', error);
    return NextResponse.json(
      { error: 'Failed to start agent evaluation' },
      { status: 500 }
    );
  }
}
