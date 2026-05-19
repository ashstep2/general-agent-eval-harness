import { AgentTask, AgentJudgeScore, AgentDimensionScore, AgentDimensionName } from '@/types';
import { AGENT_DIMENSION_MAP } from './dimensions';
import { queryModel } from '@/lib/models/client';
import { JUDGE_MODELS } from './judge-config';

const PRIMARY_JUDGE = JUDGE_MODELS.primary;
const SECONDARY_JUDGE = JUDGE_MODELS.secondary;

function buildJudgePrompt(task: AgentTask, response: string, stepLabel?: string): string {
  const dimensionDescriptions = task.rubrics
    .map((rubric) => {
      const info = AGENT_DIMENSION_MAP[rubric.dimension];
      return `- ${rubric.dimension}: ${info?.description || rubric.dimension}\n  Guidance: ${rubric.guidance}`;
    })
    .join('\n');

  return `You are an expert evaluator of coding agent performance.

Task: ${task.title}
Product question: ${task.productQuestion}
${stepLabel ? `Step: ${stepLabel}` : ''}

Expected behavior:
${task.expectedBehavior}

Agent output:
${response || '[No response]'}

Dimensions to score (1-5):
${dimensionDescriptions}

Scoring guidelines:
- 5: Excellent, fully meets expectations
- 4: Good, meets expectations with minor issues
- 3: Acceptable, partial success
- 2: Poor, significant issues
- 1: Fail, does not meet expectations

Respond with JSON only:
{
  "scores": [
    { "dimension": "dimension_name", "score": 1-5, "reasoning": "brief explanation" }
  ]
}`;
}

async function scoreWithJudge(
  judgeModelId: string,
  task: AgentTask,
  response: string,
  stepLabel?: string
): Promise<AgentJudgeScore> {
  const prompt = buildJudgePrompt(task, response, stepLabel);
  const judgeResponse = await queryModel(judgeModelId, prompt);
  const text = judgeResponse.response || '';
  const jsonMatch = text.match(/\{[\s\S]*\}/);

  if (!jsonMatch) {
    return fallbackScore(judgeModelId, task, 'Failed to parse judge response');
  }

  try {
    const parsed = JSON.parse(jsonMatch[0]) as {
      scores: Array<{ dimension: string; score: number; reasoning: string }>;
    };

    const dimensionScores: AgentDimensionScore[] = parsed.scores.map((s) => ({
      dimension: s.dimension as AgentDimensionName,
      score: Math.min(5, Math.max(1, s.score)),
      reasoning: s.reasoning,
    }));

    const overallScore =
      dimensionScores.reduce((sum, s) => sum + s.score, 0) /
      Math.max(1, dimensionScores.length);

    return {
      modelId: judgeModelId,
      dimensionScores,
      overallScore,
    };
  } catch (error) {
    return fallbackScore(
      judgeModelId,
      task,
      error instanceof Error ? error.message : 'Unknown judge error'
    );
  }
}

function fallbackScore(
  judgeModelId: string,
  task: AgentTask,
  reason: string
): AgentJudgeScore {
  const dimensionScores = task.rubrics.map((rubric) => ({
    dimension: rubric.dimension,
    score: 1,
    reasoning: `Evaluation failed: ${reason}`,
  }));

  return {
    modelId: judgeModelId,
    dimensionScores,
    overallScore: 1,
  };
}

export async function scoreWithPrimaryJudge(
  task: AgentTask,
  response: string,
  stepLabel?: string
) {
  return scoreWithJudge(PRIMARY_JUDGE, task, response, stepLabel);
}

export async function scoreWithSecondaryJudge(
  task: AgentTask,
  response: string,
  stepLabel?: string
) {
  return scoreWithJudge(SECONDARY_JUDGE, task, response, stepLabel);
}

// Re-export so server modules can keep importing JUDGE_MODELS from here.
export { JUDGE_MODELS };

/**
 * Cross-family scoring: to avoid same-family bias, use the judge from the
 * opposite provider to determine the ranking score.
 *
 * - Anthropic models → scored by OpenAI judge (GPT-5.4) = secondary
 * - OpenAI models → scored by Anthropic judge (Sonnet 4) = primary
 * - Google models → scored by Anthropic judge (Sonnet 4) = primary
 *
 * Returns 'primary' or 'secondary' to indicate which judge's scores should
 * drive the weighted score and winner determination.
 */
export function getCrossFamilyJudgeRole(
  modelProvider: 'anthropic' | 'openai' | 'google'
): 'primary' | 'secondary' {
  // Primary judge is Anthropic (Sonnet 4), secondary is OpenAI (GPT-5.4).
  // Anthropic models use the OpenAI judge (secondary).
  // OpenAI and Google models use the Anthropic judge (primary).
  return modelProvider === 'anthropic' ? 'secondary' : 'primary';
}
