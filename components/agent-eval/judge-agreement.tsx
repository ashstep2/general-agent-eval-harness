'use client';

import { JUDGE_MODELS } from '@/lib/agent-eval/judge-config';
import { getModelDisplayName } from '@/lib/data/models';

const PRIMARY_JUDGE_NAME = getModelDisplayName(JUDGE_MODELS.primary);
const SECONDARY_JUDGE_NAME = getModelDisplayName(JUDGE_MODELS.secondary);

interface JudgeAgreementProps {
  alignmentRate: number;
}

export function JudgeAgreement({ alignmentRate }: JudgeAgreementProps) {
  const percent = Math.round(alignmentRate * 100);
  const level = percent >= 75 ? 'High' : percent >= 50 ? 'Moderate' : 'Low';
  const levelColor = percent >= 75 ? 'text-emerald-600' : percent >= 50 ? 'text-amber-600' : 'text-red-600';

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-5">
      <div className="text-xs font-medium uppercase tracking-wide text-gray-400">
        Judge agreement
      </div>
      <div className="mt-2 flex items-baseline gap-2">
        <span className="text-2xl font-semibold text-black">{percent}%</span>
        <span className={`text-sm font-medium ${levelColor}`}>{level}</span>
      </div>
      <p className="mt-3 text-sm leading-relaxed text-gray-500">
        Two judges score every response independently. Agreement = both scored within 1 point.
        Higher agreement means more confidence in the result.
      </p>
      <div className="mt-3 space-y-1 text-xs text-gray-400">
        <div className="flex items-center justify-between">
          <span>{PRIMARY_JUDGE_NAME}</span>
          <span>scores OpenAI &amp; Google models</span>
        </div>
        <div className="flex items-center justify-between">
          <span>{SECONDARY_JUDGE_NAME}</span>
          <span>scores Anthropic models</span>
        </div>
      </div>
      <div className="mt-2 text-[10px] text-gray-300">
        Cross-family scoring eliminates same-provider bias
      </div>
    </div>
  );
}
