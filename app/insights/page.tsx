'use client';

import { useState } from 'react';
import { RadarChart } from '@/components/agent-eval/radar-chart';

// ── Aggregated run data ──
// Fresh flagship runs (10) + historical baseline (16) + 2 misc = 28 total
// Source: outputs/latest-run-metrics.json (regenerate via `npm run metrics`)

const TOTAL_RUNS = 30;

// New flagship matchup: GPT-5.5 vs Claude Opus 4.7 (10 runs, all single_shot)
const GPT55_DIMS: Record<string, number> = {
  correctness: 4.80,
  style_adherence: 4.80,
  context_utilization: 4.80,
  completeness: 4.60,
  explanation_quality: 4.80,
  edge_case_handling: 4.40,
};

const OPUS47_DIMS: Record<string, number> = {
  correctness: 4.00,
  style_adherence: 4.10,
  context_utilization: 4.20,
  completeness: 4.20,
  explanation_quality: 4.70,
  edge_case_handling: 3.70,
};

// Historical baseline: GPT-5.3 Codex vs Claude Opus 4.6 (16 runs)
const CODEX_DIMS: Record<string, number> = {
  correctness: 4.75,
  style_adherence: 4.75,
  context_utilization: 4.88,
  completeness: 4.69,
  explanation_quality: 4.81,
  edge_case_handling: 4.25,
};

const OPUS46_DIMS: Record<string, number> = {
  correctness: 3.75,
  style_adherence: 4.00,
  context_utilization: 3.56,
  completeness: 3.81,
  explanation_quality: 4.50,
  edge_case_handling: 3.31,
};

// Headline gap-closure metrics
const NEW_GAP = 0.50;       // GPT-5.5 weighted score − Opus 4.7
const HISTORICAL_GAP = 0.82; // GPT-5.3 Codex − Opus 4.6
const GAP_CLOSURE_PCT = Math.round((1 - NEW_GAP / HISTORICAL_GAP) * 100);

const NEW_CONTEXT_GAP = GPT55_DIMS.context_utilization - OPUS47_DIMS.context_utilization;
const NEW_EXPLANATION_GAP = GPT55_DIMS.explanation_quality - OPUS47_DIMS.explanation_quality;
const HISTORICAL_CONTEXT_GAP = CODEX_DIMS.context_utilization - OPUS46_DIMS.context_utilization;

// Radar chart shows the new flagship matchup as the headline story
const RADAR_DATA = {
  'gpt-5.5': {
    modelId: 'gpt-5.5',
    displayName: 'GPT-5.5',
    dimensionAverages: GPT55_DIMS,
  },
  'claude-opus-4-7': {
    modelId: 'claude-opus-4-7',
    displayName: 'Claude Opus 4.7',
    dimensionAverages: OPUS47_DIMS,
  },
};

const AGENT_LOOP_DELTAS = [
  {
    task: 'Review Caching Layer PR',
    singleShot: 3.55,
    agentLoop: 4.75,
    delta: 1.20,
    singleShotRunId: '0c4948c4-dbee-45a2-bc94-5aaf04102d04',
    runId: '2d97e235-30dc-461c-9435-b5dba144c3aa',
  },
  {
    task: 'Refactor Callbacks to Async/Await',
    singleShot: 2.45,
    agentLoop: 3.50,
    delta: 1.05,
    singleShotRunId: '10608145-5e70-4077-a417-75fadc66030d',
    runId: '5fccd0ae-f8f0-4719-ac07-d7f637e8a491',
  },
  {
    task: 'Debug Memory Leak in WebSocket Handler',
    singleShot: 3.05,
    agentLoop: 3.80,
    delta: 0.75,
    singleShotRunId: '3c6501c0-9b6f-4562-afd6-eec860f44683',
    runId: '3a64f713-bf3f-4bfb-b0bb-90dbf8127069',
  },
];

const AGREEMENT = { shipFast: 100, devTrust: 76, newFlagship: 86 };

// Per-dimension agreement % for the new GPT-5.5 vs Opus 4.7 runs (10 runs each side)
const DIM_AGREEMENT: Record<string, number> = {
  explanation_quality: 100,
  completeness: 90,
  style_adherence: 90,
  correctness: 80,
  edge_case_handling: 85,
  context_utilization: 70,
};

// Same-family minus cross-family overall scores. Anthropic still inflates Anthropic;
// the OpenAI judge tends to be stricter on its own family.
const BIAS_STATS = {
  // GPT-5.5 vs Opus 4.7 (new flagship matchup, 10 runs)
  newClaudeBias: 0.68,    // Sonnet-on-Opus-4.7 minus GPT-on-Opus-4.7
  newGptBias: -0.75,      // GPT-on-GPT-5.5 minus Sonnet-on-GPT-5.5
  // Historical baseline for comparison
  claudePrimaryMinusSecondary: 0.95,  // baseline Sonnet-on-Opus-4.6 inflation
  codexPrimaryMinusSecondary: -0.71,  // baseline GPT-on-Codex
};

const EVIDENCE = {
  // Headline insight now points at the new flagship matchup runs.
  finding1: [
    '63f2da90-892a-409e-aa21-b04d73fb3e95',
    '5e8d448e-6306-4513-93f1-2ef77200ba2c',
    '9f46df61-c773-4c20-8453-77d3b352c71f',
  ],
  finding2: [
    '0c4948c4-dbee-45a2-bc94-5aaf04102d04',
    '2d97e235-30dc-461c-9435-b5dba144c3aa',
    '10608145-5e70-4077-a417-75fadc66030d',
    '5fccd0ae-f8f0-4719-ac07-d7f637e8a491',
  ],
  finding3: ['10608145-5e70-4077-a417-75fadc66030d'],
  methodology: [
    'e7b91243-801b-45ea-96e5-8abf6a4883eb',
    '90c16c1e-803c-4227-a6d3-60a5a905ab46',
  ],
  insight6: [
    'a4f54b5b-dc75-46d6-aa47-919c427e0304',
    '3c6501c0-9b6f-4562-afd6-eec860f44683',
  ],
  insight7: [
    '090a3a64-ca37-4131-b878-bdff8d32fdad',
    'e3a84e03-5f24-435f-b5cf-57fcd8bcb463',
  ],
  insight8: [
    'e3a84e03-5f24-435f-b5cf-57fcd8bcb463',
    'e7b91243-801b-45ea-96e5-8abf6a4883eb',
  ],
  insight9: [
    '5fccd0ae-f8f0-4719-ac07-d7f637e8a491',
    '3a64f713-bf3f-4bfb-b0bb-90dbf8127069',
  ],
  insight10: [
    '0c4948c4-dbee-45a2-bc94-5aaf04102d04',
    '10608145-5e70-4077-a417-75fadc66030d',
    '90c16c1e-803c-4227-a6d3-60a5a905ab46',
  ],
};

const RUN_TITLES: Record<string, string> = {
  // New flagship runs (GPT-5.5 vs Opus 4.7)
  '9f46df61-c773-4c20-8453-77d3b352c71f': 'Add Pagination (5.5 vs 4.7)',
  '63f2da90-892a-409e-aa21-b04d73fb3e95': 'Off-by-One Bugfix (5.5 vs 4.7)',
  'dd9b830e-0fe4-4d2b-9fbf-bb3ee8169e16': 'Refactor Callbacks (5.5 vs 4.7)',
  '1743d534-1de5-42c0-b880-993498d7f96a': 'Auth Tests (5.5 vs 4.7)',
  'f83d0159-c241-40b4-b2fe-2ad7fafbca26': 'Caching PR Review (5.5 vs 4.7)',
  '5e8d448e-6306-4513-93f1-2ef77200ba2c': 'TS Types (5.5 vs 4.7)',
  '2a187f25-b0f2-4d5f-9899-7276385a5731': 'Retry Backoff (5.5 vs 4.7)',
  'd660cf8c-3e20-476c-87fb-4cf99942b715': 'WebSocket Memory Leak (5.5 vs 4.7)',
  '7a174fe4-0cf2-445b-bf9f-cf93ddcf0c15': 'Dark Mode (5.5 vs 4.7)',
  'c972558e-12a9-4bdd-a32f-77d3a1eacb34': 'Optimize DB Query (5.5 vs 4.7)',
  'e90167a0-eaee-4a59-955f-2e35b9558c80': 'Caching PR Review (5.5 vs 4.7, buggy loop)',
  'e6501969-5f7f-49bd-b041-84fdc3ddf8d0': 'Caching PR Review (5.5 vs 4.7, fixed loop)',
  // Historical baseline runs (GPT-5.3 Codex vs Opus 4.6)
  'a4f54b5b-dc75-46d6-aa47-919c427e0304': 'Off-by-One Bugfix (baseline)',
  '090a3a64-ca37-4131-b878-bdff8d32fdad': 'Optimize DB Query (baseline)',
  'e3a84e03-5f24-435f-b5cf-57fcd8bcb463': 'Off-by-One Bugfix (baseline, ship fast)',
  '0c4948c4-dbee-45a2-bc94-5aaf04102d04': 'Caching PR Review (baseline)',
  '2d97e235-30dc-461c-9435-b5dba144c3aa': 'Caching PR Review (baseline, agent loop)',
  '10608145-5e70-4077-a417-75fadc66030d': 'Refactor Callbacks (baseline)',
  '5fccd0ae-f8f0-4719-ac07-d7f637e8a491': 'Refactor Callbacks (baseline, agent loop)',
  '3c6501c0-9b6f-4562-afd6-eec860f44683': 'Memory Leak (baseline)',
  '3a64f713-bf3f-4bfb-b0bb-90dbf8127069': 'Memory Leak (baseline, agent loop)',
  'e7b91243-801b-45ea-96e5-8abf6a4883eb': 'Dark Mode (baseline)',
  '90c16c1e-803c-4227-a6d3-60a5a905ab46': 'Dark Mode (baseline, ship fast)',
};

// ── Insight definitions ──

const INSIGHTS = [
  { num: 1, title: 'Context utilization is the biggest differentiator' },
  { num: 2, title: 'Same-family judge bias is real and measurable' },
  { num: 3, title: 'Agent loops help weak models, hurt strong ones' },
  { num: 4, title: 'Explanation quality is necessary but not sufficient' },
  { num: 5, title: 'Judge agreement correlates with objectivity' },
  { num: 6, title: 'Edge case handling is the most volatile dimension' },
  { num: 7, title: 'Correctness has the most critical judge disagreements' },
  { num: 8, title: 'Weight presets change winners: philosophy is a design variable' },
  { num: 9, title: 'Silent refusal is an invisible failure mode' },
  { num: 10, title: 'Well-defined tasks produce stable results; ambiguous ones don\'t' },
];

// ── Components ──

function EvidenceLinks({ runIds }: { runIds: string[] }) {
  if (runIds.length === 0) return null;
  return (
    <div className="mt-4 flex flex-wrap gap-2 text-xs">
      <span className="text-[10px] font-medium uppercase tracking-widest text-gray-400">Evidence:</span>
      {runIds.map((id) => (
        <a
          key={id}
          href={`/agent-eval/results?runId=${id}`}
          className="rounded border border-gray-200 px-2 py-0.5 text-gray-500 transition-colors hover:border-gray-400 hover:text-black"
        >
          {RUN_TITLES[id] || 'Run'} · {id.slice(0, 8)}
        </a>
      ))}
    </div>
  );
}

function InsightSection({
  num,
  title,
  children,
  implication,
  evidenceRunIds,
}: {
  num: number;
  title: string;
  children: React.ReactNode;
  implication: string;
  evidenceRunIds: string[];
}) {
  return (
    <section id={`insight-${num}`} className="scroll-mt-24">
      <div className="mb-1 text-xs font-medium text-gray-400">Insight {num}</div>
      <h3 className="mb-3 text-lg font-semibold text-black">{title}</h3>
      {children}
      <div className="mt-4 rounded-md bg-gray-50 px-4 py-3">
        <div className="text-[10px] font-medium uppercase tracking-widest text-gray-400">Product implication</div>
        <p className="mt-1 text-sm text-gray-700">{implication}</p>
      </div>
      <EvidenceLinks runIds={evidenceRunIds} />
    </section>
  );
}

// ── Edge case stats ──

const EDGE_CASE_RANGE = {
  codexMin: 3.0,
  codexMax: 5.0,
  claudeMin: 2.0,
  claudeMax: 5.0,
};

const CORRECTNESS_DISAGREEMENTS = {
  sameFamily: 4.5,
  crossFamily: 3.0,
  gap: 1.5,
};

// ── Page ──

export default function InsightsPage() {
  const [showMethodology, setShowMethodology] = useState(false);

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">

      {/* ── Header ── */}
      <div className="mb-6">
        <h1 className="text-3xl font-semibold tracking-tight text-black">
          What {TOTAL_RUNS} eval runs reveal about coding agents
        </h1>
        <p className="mt-2 text-base text-gray-500">
          Cross-provider dual-judge evaluation across 10 coding tasks and 6 scoring dimensions.
          Headline matchup: <strong>GPT-5.5 vs Claude Opus 4.7</strong> (10 single-shot + 1 agent_loop spike).
          Historical baseline: GPT-5.3 Codex vs Opus 4.6 (16 runs). Judges: Claude Sonnet 4 + GPT-5.4.
        </p>
      </div>

      {/* New flagship gap-closure banner */}
      <div className="mb-10 rounded-lg border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm leading-relaxed text-emerald-900">
        <div className="text-xs font-semibold uppercase tracking-widest text-emerald-700">Fresh runs · GPT-5.5 vs Claude Opus 4.7</div>
        <p className="mt-1">
          GPT-5.5 still leads the matchup ({10 - 1} of 10 tasks won), but Opus 4.7 closed{' '}
          <strong>{GAP_CLOSURE_PCT}%</strong> of the historical weighted gap (0.82 → {NEW_GAP.toFixed(2)}).
          The biggest improvement: context utilization, where the gap shrank from{' '}
          <strong>+{HISTORICAL_CONTEXT_GAP.toFixed(2)}</strong> to <strong>+{NEW_CONTEXT_GAP.toFixed(2)}</strong>.
          Inter-judge agreement rose to <strong>{AGREEMENT.newFlagship}%</strong> on the new flagships.
        </p>
      </div>

      {/* Scoreboard */}
      <div className="mb-10 grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-gray-200 bg-gray-200 sm:grid-cols-4">
        {[
          { stat: TOTAL_RUNS, label: 'Eval runs' },
          { stat: 10, label: 'Coding tasks' },
          { stat: 6, label: 'Dimensions' },
          { stat: 2, label: 'Cross-provider judges' },
        ].map((item) => (
          <div key={item.label} className="bg-white px-4 py-4 text-center">
            <div className="text-3xl font-bold text-gray-800">{item.stat}</div>
            <div className="mt-0.5 text-xs text-gray-500">{item.label}</div>
          </div>
        ))}
      </div>

      {/* ── TOC ── */}
      <div className="mb-6 rounded-lg border border-gray-200 bg-white">
        <div className="border-b border-gray-100 px-5 py-3">
          <h2 className="text-sm font-semibold text-black">10 insights from the data</h2>
        </div>
        <div className="divide-y divide-gray-100">
          {INSIGHTS.map((insight) => (
            <a
              key={insight.num}
              href={`#insight-${insight.num}`}
              className="flex items-start gap-3 px-5 py-3 transition-colors hover:bg-gray-50"
            >
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-semibold text-blue-700">
                {insight.num}
              </span>
              <span className="text-sm text-gray-700">{insight.title}</span>
            </a>
          ))}
        </div>
      </div>

      {/* ── Methodology (collapsed, slimmed) ── */}
      <div className="mb-10">
        <button
          onClick={() => setShowMethodology((prev) => !prev)}
          className="flex items-center gap-2 text-sm font-medium uppercase tracking-wide text-gray-400 transition-colors hover:text-gray-600"
        >
          <span className={`inline-block text-xs transition-transform ${showMethodology ? 'rotate-90' : ''}`}>&#9654;</span>
          Methodology notes
        </button>

        {showMethodology && (
          <div className="mt-6 space-y-4">
            <div className="text-sm leading-relaxed text-gray-600">
              <p className="mb-3">
                <strong>Setup:</strong> {TOTAL_RUNS} eval runs across 10 coding tasks (bug fixes, refactors, feature additions, code reviews).
                Each task scored on 6 dimensions (context utilization, correctness, edge case handling, completeness, style adherence, explanation quality) on a 1-5 scale.
                The {TOTAL_RUNS} runs split as: 10 fresh GPT-5.5 vs Opus 4.7 (single shot), 16 historical GPT-5.3 Codex vs Opus 4.6 (mixed modes), and 2 misc earlier runs.
              </p>
              <p className="mb-3">
                <strong>Judges:</strong> Cross-provider dual judges (Claude Sonnet 4 and GPT-5.4) score every run independently.
                (The historical baseline runs used Sonnet 4 + GPT-5.2.) Each judge evaluates both agents to control for prompt sensitivity.
                The ranking score comes from the cross-family judge to avoid same-family bias.
              </p>
              <p className="mb-3">
                <strong>Weight presets:</strong> Two presets encode different product philosophies (ship_fast: correctness-heavy; developer_trust: context-heavy).
                See <a href="#insight-8" className="text-blue-600 underline">Insight 8</a> for details.
              </p>
              <p>
                <strong>References:</strong>{' '}
                <a href="https://arxiv.org/abs/2410.21819" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">ICLR 2025: LLM self-preference bias</a>{' · '}
                <a href="https://arxiv.org/abs/2508.06709" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">Spiliopoulou et al. 2025</a>
              </p>
            </div>
          </div>
        )}
      </div>

      {/* ── Divider ── */}
      <div className="mb-10 border-t border-gray-200" />

      {/* ── Insights ── */}
      <div className="mb-6">
        <h2 className="text-xs font-medium uppercase tracking-widest text-gray-400">Detailed insights</h2>
      </div>

      <div className="space-y-10">

        {/* Insight 1: Context utilization */}
        <InsightSection
          num={1}
          title="Context utilization is the biggest differentiator"
          implication="The advantage is behavioral, not capability-based. Agents that make conservative, verifiable changes using the full context available win on trust. Make context utilization visible in the UX."
          evidenceRunIds={EVIDENCE.finding1}
        >
          <div className="mb-4 rounded-md border border-gray-100 bg-white p-4">
            {/* @ts-expect-error radar expects AgentModelResult but we're passing a subset */}
            <RadarChart results={RADAR_DATA} size={260} />
          </div>
          <p className="mb-2 text-sm leading-relaxed text-gray-600">
            On the new flagship matchup, the largest gap is now <strong>correctness</strong> (+{(GPT55_DIMS.correctness - OPUS47_DIMS.correctness).toFixed(2)}),
            with context utilization at +{NEW_CONTEXT_GAP.toFixed(2)} (down from +{HISTORICAL_CONTEXT_GAP.toFixed(2)} in the historical baseline).
            Narrowest gap: <strong>explanation quality</strong> (+{NEW_EXPLANATION_GAP.toFixed(2)}). Opus 4.7 nearly matched GPT-5.5 on explanation quality.
            GPT-5.5 still leads every dimension, but the advantage has compressed: context utilization is no longer the runaway differentiator it was a generation ago.
          </p>
        </InsightSection>

        {/* Insight 2: Judge bias */}
        <InsightSection
          num={2}
          title="Same-family judge bias is real and measurable"
          implication="Any eval using a single LLM judge inherits systematic bias. Treat cross-family judging as a correctness requirement. Build dual-judge pipelines by default."
          evidenceRunIds={EVIDENCE.methodology}
        >
          <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-4">
            <div className="mb-3 text-[10px] font-medium uppercase tracking-widest text-amber-700">New flagship matchup (10 runs)</div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <div className="text-[10px] font-medium uppercase tracking-widest text-amber-600">Opus 4.7 judged by Sonnet (same family)</div>
                <div className="mt-1 text-2xl font-bold text-amber-700">+{BIAS_STATS.newClaudeBias.toFixed(2)}</div>
                <div className="text-xs text-amber-600">higher than cross-family judge</div>
              </div>
              <div>
                <div className="text-[10px] font-medium uppercase tracking-widest text-gray-500">GPT-5.5 judged by GPT-5.4 (same family)</div>
                <div className="mt-1 text-2xl font-bold text-gray-600">{BIAS_STATS.newGptBias.toFixed(2)}</div>
                <div className="text-xs text-gray-500">vs cross-family judge. OpenAI judge is harsher on its own family</div>
              </div>
            </div>
            <div className="mt-3 border-t border-amber-200 pt-2 text-xs text-amber-700">
              Historical baseline (Opus 4.6 / Codex, 16 runs): same-family Anthropic inflation was{' '}
              +{BIAS_STATS.claudePrimaryMinusSecondary.toFixed(2)}pt. Bias is shrinking but persistent.
            </div>
          </div>
          <p className="mb-2 text-sm leading-relaxed text-gray-600">
            Even with new flagships, the same-family judge rated outputs higher than the cross-family judge on Anthropic models.
            The OpenAI judge skews the other way: it&apos;s harsher on GPT outputs than the Anthropic judge is. The asymmetry is itself a finding:
            self-preference is not symmetric across providers, but it&apos;s still real and still a reason to use cross-family judging.
            This matches published findings on LLM self-preference bias (<a href="https://arxiv.org/abs/2410.21819" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">ICLR 2025</a>, <a href="https://arxiv.org/abs/2508.06709" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">Spiliopoulou et al. 2025</a>).
          </p>
        </InsightSection>

        {/* Insight 3: Agent loops */}
        <InsightSection
          num={3}
          title="Agent loops help weak models, hurt strong ones"
          implication="Loops are not free. Their value depends entirely on the gap between single-shot quality and ceiling. As base models improve, the ROI on loops shrinks toward zero, and on tasks where single-shot already hits ceiling, loops introduce regression. Treat loop architecture as a model-tier decision, not a default."
          evidenceRunIds={[...EVIDENCE.finding2, 'e6501969-5f7f-49bd-b041-84fdc3ddf8d0']}
        >
          {/* New flagship spike: Caching PR Review */}
          <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 p-4">
            <div className="mb-2 text-[10px] font-medium uppercase tracking-widest text-rose-700">New flagship spike · Caching PR Review (1 run, agent_loop)</div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[24rem] text-sm">
                <thead>
                  <tr className="border-b border-rose-200">
                    <th className="py-1.5 text-left font-medium text-rose-800">Model</th>
                    <th className="py-1.5 text-right font-medium text-rose-800">Single-shot</th>
                    <th className="py-1.5 text-right font-medium text-rose-800">Agent loop</th>
                    <th className="py-1.5 text-right font-medium text-rose-800">Delta</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-rose-100">
                    <td className="py-1.5 text-rose-900">GPT-5.5</td>
                    <td className="py-1.5 text-right font-mono text-rose-700">5.00</td>
                    <td className="py-1.5 text-right font-mono text-rose-700">4.65</td>
                    <td className="py-1.5 text-right font-mono font-semibold text-rose-700">−0.35</td>
                  </tr>
                  <tr>
                    <td className="py-1.5 text-rose-900">Claude Opus 4.7</td>
                    <td className="py-1.5 text-right font-mono text-rose-700">5.00</td>
                    <td className="py-1.5 text-right font-mono text-rose-700">5.00</td>
                    <td className="py-1.5 text-right font-mono font-semibold text-emerald-700">0.00</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-rose-800">
              Both flagships ace single_shot at ceiling (5.00). With multi-step reasoning, <strong>Opus 4.7 holds ceiling</strong>;
              GPT-5.5 regresses by 0.35. Compared to GPT-5.3 Codex&apos;s historical <strong>+1.20</strong> boost on the same task,
              the value of multi-step reasoning has collapsed, and is now <em>model-dependent</em>: Opus 4.7 is more robust to it than GPT-5.5.
            </p>
          </div>

          {/* Methodology disclosure: bug found and fixed in agent_loop prompt threading */}
          <div className="mb-4 rounded-lg border border-blue-200 bg-blue-50 p-4 text-xs leading-relaxed text-blue-900">
            <div className="mb-1 font-semibold uppercase tracking-widest text-blue-700">Methodology note</div>
            <p>
              An earlier version of the agent_loop did not thread prior step output into steps 2-4 (only step 5 saw any prior context),
              so the &quot;loop&quot; was effectively 5 near-independent prompts. After fixing the prompt threading and re-running,
              the GPT-5.5 delta moved from −0.15 to −0.35 and the Opus 4.7 delta moved from −0.25 to 0.00 on the same task.
              The headline finding (loops don&apos;t help these flagships on this task) survives; the per-model directionality is more pronounced.
              Bug + fix is in <code className="rounded bg-blue-100 px-1">lib/agent-eval/prompt.ts</code>.
            </p>
          </div>

          {/* Historical baseline table */}
          <div className="mb-3 overflow-hidden rounded-md border border-gray-200">
            <div className="bg-gray-50 px-4 py-1.5 text-[10px] font-medium uppercase tracking-widest text-gray-500">
              Historical baseline · GPT-5.3 Codex (3 runs)
            </div>
            <div className="overflow-x-auto">
            <table className="w-full min-w-[32rem] text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="px-4 py-2 text-left font-medium text-gray-600">Task</th>
                  <th className="px-4 py-2 text-right font-medium text-gray-600">Single-shot</th>
                  <th className="px-4 py-2 text-right font-medium text-gray-600">Agent loop</th>
                  <th className="px-4 py-2 text-right font-medium text-gray-600">Delta</th>
                </tr>
              </thead>
              <tbody>
                {AGENT_LOOP_DELTAS.map((d) => (
                  <tr key={d.task} className="border-b border-gray-50">
                    <td className="px-4 py-2 text-gray-700">{d.task}</td>
                    <td className="px-4 py-2 text-right font-mono text-gray-500">{d.singleShot.toFixed(2)}</td>
                    <td className="px-4 py-2 text-right font-mono text-gray-700">{d.agentLoop.toFixed(2)}</td>
                    <td className="px-4 py-2 text-right font-mono text-emerald-600">+{d.delta.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          </div>
          <p className="mb-2 text-sm leading-relaxed text-gray-600">
            On the historical Codex / Opus 4.6 generation, loops produced strong gains: caching PR review +{AGENT_LOOP_DELTAS[0].delta.toFixed(2)},
            refactor +{AGENT_LOOP_DELTAS[1].delta.toFixed(2)}, memory leak +{AGENT_LOOP_DELTAS[2].delta.toFixed(2)}.
            But on the new flagships, the same task that benefitted most from loops now <strong>regresses</strong> with them.
            The single-shot ceiling has risen faster than the loop ceiling; there&apos;s less room left for the loop to help, and the extra reasoning steps occasionally introduce noise.
            <em> N=1 on the new flagship side; the direction is more important than the magnitude until more runs land.</em>
          </p>
        </InsightSection>

        {/* Insight 4: Explanation quality */}
        <InsightSection
          num={4}
          title="Explanation quality is necessary but not sufficient"
          implication="Two product archetypes emerge: the pair programmer (explains what to do, human verifies) and the delegated agent (does it correctly, minimal explanation needed). For autonomous delegation, correctness matters more than explanation."
          evidenceRunIds={EVIDENCE.finding3}
        >
          <div className="mb-3 grid gap-3 sm:grid-cols-2">
            <div className="rounded-md border border-gray-200 bg-white p-4">
              <div className="mb-2 text-[10px] font-medium uppercase tracking-widest text-gray-400">
                Pair Programmer Archetype
              </div>
              <div className="space-y-1 text-sm text-gray-600">
                <div>Explanation: <strong className="text-black">{OPUS46_DIMS.explanation_quality.toFixed(2)}</strong>/5</div>
                <div>Correctness: <strong className="text-black">{OPUS46_DIMS.correctness.toFixed(2)}</strong>/5</div>
              </div>
              <div className="mt-2 text-xs text-gray-500">Explains well; code may need human correction.</div>
            </div>
            <div className="rounded-md border border-blue-200 bg-blue-50 p-4">
              <div className="mb-2 text-[10px] font-medium uppercase tracking-widest text-blue-500">
                Delegated Agent Archetype
              </div>
              <div className="space-y-1 text-sm text-blue-800">
                <div>Explanation: <strong>{CODEX_DIMS.explanation_quality.toFixed(2)}</strong>/5</div>
                <div>Correctness: <strong>{CODEX_DIMS.correctness.toFixed(2)}</strong>/5</div>
              </div>
              <div className="mt-2 text-xs text-blue-600">Code works. Explanation is adequate.</div>
            </div>
          </div>
        </InsightSection>

        {/* Insight 5: Judge agreement */}
        <InsightSection
          num={5}
          title="Judge agreement correlates with objectivity"
          implication="Dimensions with low judge agreement should carry lower weight in automated scoring, or require human tiebreaking. Build eval systems that surface disagreement, not just scores."
          evidenceRunIds={EVIDENCE.methodology}
        >
          <div className="mb-3">
            <p className="mb-3 text-sm text-gray-600">
              Ship_fast preset: <strong>{AGREEMENT.shipFast}%</strong> agreement.
              Developer_trust preset: <strong>{AGREEMENT.devTrust}%</strong>.
            </p>
            <div className="space-y-2">
              {Object.entries(DIM_AGREEMENT)
                .sort(([, a], [, b]) => b - a)
                .map(([key, rate]) => {
                  const label = key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
                  const color = rate >= 85 ? 'text-emerald-600' : rate >= 75 ? 'text-gray-600' : 'text-amber-600';
                  return (
                    <div key={key} className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">{label}</span>
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-20 rounded-full bg-gray-100">
                          <div className="h-1.5 rounded-full bg-gray-800" style={{ width: `${rate}%` }} />
                        </div>
                        <span className={`w-12 text-right font-mono text-xs ${color}`}>{rate}%</span>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
          <p className="text-sm leading-relaxed text-gray-600">
            Objective dimensions (explanation quality, style adherence) see high agreement. Subjective ones (context utilization) see the most disagreement: exactly where the scoring gap is largest.
          </p>
        </InsightSection>

        {/* Insight 6: Edge case volatility */}
        <InsightSection
          num={6}
          title="Edge case handling is the most volatile dimension"
          implication="Edge case handling scores are noisy enough that a single eval run can't be trusted. Run multiple evaluations and report variance, not just means. Flag high-variance dimensions in the UI."
          evidenceRunIds={EVIDENCE.insight6}
        >
          <div className="mb-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-md border border-gray-200 bg-white p-4 text-center">
              <div className="text-[10px] font-medium uppercase tracking-widest text-gray-400">Codex edge case range</div>
              <div className="mt-2 text-2xl font-bold text-gray-800">{EDGE_CASE_RANGE.codexMin.toFixed(1)} – {EDGE_CASE_RANGE.codexMax.toFixed(1)}</div>
              <div className="mt-1 text-xs text-gray-500">across tasks (avg {CODEX_DIMS.edge_case_handling.toFixed(2)})</div>
            </div>
            <div className="rounded-md border border-gray-200 bg-white p-4 text-center">
              <div className="text-[10px] font-medium uppercase tracking-widest text-gray-400">Claude edge case range</div>
              <div className="mt-2 text-2xl font-bold text-gray-800">{EDGE_CASE_RANGE.claudeMin.toFixed(1)} – {EDGE_CASE_RANGE.claudeMax.toFixed(1)}</div>
              <div className="mt-1 text-xs text-gray-500">across tasks (avg {OPUS46_DIMS.edge_case_handling.toFixed(2)})</div>
            </div>
          </div>
          <p className="text-sm leading-relaxed text-gray-600">
            Edge case handling has a wider score range than any other dimension for both agents. A 2.0–5.0 spread means the &quot;average&quot; is misleading; task type determines edge case performance more than model choice.
          </p>
        </InsightSection>

        {/* Insight 7: Correctness disagreements */}
        <InsightSection
          num={7}
          title="Correctness has the most critical judge disagreements"
          implication="When judges disagree on correctness, the stakes are highest: a false positive means shipping broken code. Surface correctness disagreements prominently and require human review when judges split."
          evidenceRunIds={EVIDENCE.insight7}
        >
          <div className="mb-4 rounded-lg border border-red-100 bg-red-50 p-4">
            <div className="grid grid-cols-1 gap-4 text-center sm:grid-cols-3">
              <div>
                <div className="text-[10px] font-medium uppercase tracking-widest text-red-400">Same-family score</div>
                <div className="mt-1 text-2xl font-bold text-red-700">{CORRECTNESS_DISAGREEMENTS.sameFamily.toFixed(1)}</div>
              </div>
              <div>
                <div className="text-[10px] font-medium uppercase tracking-widest text-gray-400">Cross-family score</div>
                <div className="mt-1 text-2xl font-bold text-gray-700">{CORRECTNESS_DISAGREEMENTS.crossFamily.toFixed(1)}</div>
              </div>
              <div>
                <div className="text-[10px] font-medium uppercase tracking-widest text-red-400">Disagreement gap</div>
                <div className="mt-1 text-2xl font-bold text-red-600">{CORRECTNESS_DISAGREEMENTS.gap.toFixed(1)}</div>
              </div>
            </div>
          </div>
          <p className="text-sm leading-relaxed text-gray-600">
            On the worst correctness disagreements, the same-family judge scored {CORRECTNESS_DISAGREEMENTS.sameFamily}/5 while the cross-family judge scored {CORRECTNESS_DISAGREEMENTS.crossFamily}/5.
            The cross-family judge caught broken API contracts and incomplete implementations that the same-family judge missed entirely.
          </p>
        </InsightSection>

        {/* Insight 8: Weight presets */}
        <InsightSection
          num={8}
          title="Weight presets change winners: philosophy is a design variable"
          implication="There is no single 'best' agent; it depends on what you value. Eval frameworks should make weight presets explicit and let teams encode their own product philosophy into scoring."
          evidenceRunIds={EVIDENCE.insight8}
        >
          <div className="mb-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-md border border-gray-200 bg-white p-4">
              <div className="mb-2 text-[10px] font-medium uppercase tracking-widest text-gray-400">Ship Fast Preset</div>
              <div className="space-y-1 text-xs text-gray-600">
                <div>Correctness: <strong>40%</strong></div>
                <div>Completeness: <strong>25%</strong></div>
                <div>Style: <strong>15%</strong></div>
                <div>Edge cases: <strong>10%</strong></div>
                <div>Explanation: <strong>5%</strong></div>
                <div>Context: <strong>5%</strong></div>
              </div>
              <div className="mt-3 rounded bg-gray-100 px-2 py-1 text-center text-xs font-medium text-gray-700">100% judge agreement</div>
            </div>
            <div className="rounded-md border border-blue-200 bg-blue-50 p-4">
              <div className="mb-2 text-[10px] font-medium uppercase tracking-widest text-blue-500">Developer Trust Preset</div>
              <div className="space-y-1 text-xs text-blue-800">
                <div>Context: <strong>25%</strong></div>
                <div>Correctness: <strong>25%</strong></div>
                <div>Edge cases: <strong>20%</strong></div>
                <div>Completeness: <strong>15%</strong></div>
                <div>Style: <strong>10%</strong></div>
                <div>Explanation: <strong>5%</strong></div>
              </div>
              <div className="mt-3 rounded bg-blue-100 px-2 py-1 text-center text-xs font-medium text-blue-700">76% judge agreement</div>
            </div>
          </div>
          <p className="text-sm leading-relaxed text-gray-600">
            Ship_fast concentrates weight on correctness and completeness (both high-agreement dimensions). Developer_trust distributes weight across context and edge cases (the most contentious dimensions). The preset itself encodes a product philosophy.
          </p>
        </InsightSection>

        {/* Insight 9: Silent refusal */}
        <InsightSection
          num={9}
          title="Silent refusal is an invisible failure mode"
          implication="Track completion rate alongside quality scores. An agent that silently skips requirements looks correct on cursory review but fails in production. Build verification loops that check for completeness, not just correctness."
          evidenceRunIds={EVIDENCE.insight9}
        >
          <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-4">
            <div className="text-sm text-amber-800">
              <strong>Pattern observed:</strong> In agent loop runs, one agent occasionally acknowledged a requirement in its reasoning
              but omitted it from the final output: no error, no explanation. The judge scored the output
              based on what was present, missing the gap entirely.
            </div>
          </div>
          <p className="text-sm leading-relaxed text-gray-600">
            Silent refusal is harder to catch than an outright error. The output looks clean, passes surface-level review, and only fails when a human checks against the original spec. This is particularly dangerous for autonomous agent workflows where human review is minimal.
          </p>
        </InsightSection>

        {/* Insight 10: Task clarity */}
        <InsightSection
          num={10}
          title="Well-defined tasks produce stable results; ambiguous ones don't"
          implication="Eval reliability depends more on task specification quality than on model capability. Invest in task design: clear acceptance criteria, concrete inputs/outputs, and explicit edge case requirements produce reproducible results."
          evidenceRunIds={EVIDENCE.insight10}
        >
          <div className="mb-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-md border border-emerald-200 bg-emerald-50 p-4 text-center">
              <div className="text-[10px] font-medium uppercase tracking-widest text-emerald-600">Well-defined tasks</div>
              <div className="mt-2 text-2xl font-bold text-emerald-700">±0.3</div>
              <div className="mt-1 text-xs text-emerald-600">score variance across runs</div>
              <div className="mt-2 text-xs text-emerald-500">e.g., Off-by-one bugfix, DB query optimization</div>
            </div>
            <div className="rounded-md border border-amber-200 bg-amber-50 p-4 text-center">
              <div className="text-[10px] font-medium uppercase tracking-widest text-amber-600">Ambiguous tasks</div>
              <div className="mt-2 text-2xl font-bold text-amber-700">±1.2</div>
              <div className="mt-1 text-xs text-amber-600">score variance across runs</div>
              <div className="mt-2 text-xs text-amber-500">e.g., Refactor callbacks, Add dark mode</div>
            </div>
          </div>
          <p className="text-sm leading-relaxed text-gray-600">
            Tasks with concrete acceptance criteria (fix this bug, optimize this query) show tight score distributions.
            Open-ended tasks (refactor this, add this feature) show 4x higher variance, making single-run comparisons unreliable.
          </p>
        </InsightSection>

      </div>

      {/* CTA */}
      <div className="mt-10 text-center">
        <a href="/agent-eval" className="text-sm text-blue-600 transition-colors hover:text-black">
          Run the evals yourself →
        </a>
      </div>
    </div>
  );
}
