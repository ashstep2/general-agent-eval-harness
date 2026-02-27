'use client';

import { useState } from 'react';
import { RadarChart } from '@/components/agent-eval/radar-chart';

// ── Hardcoded data from 18 eval runs ──

const TOTAL_RUNS = 18;

const CODEX_DIMS: Record<string, number> = {
  context_utilization: 4.88,
  correctness: 4.75,
  edge_case_handling: 4.25,
  completeness: 4.69,
  style_adherence: 4.75,
  explanation_quality: 4.81,
};

const CLAUDE_DIMS: Record<string, number> = {
  context_utilization: 3.56,
  correctness: 3.75,
  edge_case_handling: 3.31,
  completeness: 3.81,
  style_adherence: 4.00,
  explanation_quality: 4.50,
};

const CONTEXT_GAP = CODEX_DIMS.context_utilization - CLAUDE_DIMS.context_utilization;
const EXPLANATION_GAP = CODEX_DIMS.explanation_quality - CLAUDE_DIMS.explanation_quality;

const RADAR_DATA = {
  'gpt-5.3-codex': {
    modelId: 'gpt-5.3-codex',
    displayName: 'GPT-5.3 Codex',
    dimensionAverages: CODEX_DIMS,
  },
  'claude-opus-4-6': {
    modelId: 'claude-opus-4-6',
    displayName: 'Claude Opus 4.6',
    dimensionAverages: CLAUDE_DIMS,
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

const AGREEMENT = { shipFast: 100, devTrust: 76 };

const DIM_AGREEMENT: Record<string, number> = {
  explanation_quality: 94,
  style_adherence: 84,
  correctness: 81,
  completeness: 81,
  edge_case_handling: 81,
  context_utilization: 62,
};

const BIAS_STATS = {
  claudePrimaryMinusSecondary: 1.33,
  codexPrimaryMinusSecondary: -0.25,
};

const EVIDENCE = {
  finding1: [
    'a4f54b5b-dc75-46d6-aa47-919c427e0304',
    '090a3a64-ca37-4131-b878-bdff8d32fdad',
    'e3a84e03-5f24-435f-b5cf-57fcd8bcb463',
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
  'a4f54b5b-dc75-46d6-aa47-919c427e0304': 'Off-by-One Bugfix (single shot, developer trust)',
  '090a3a64-ca37-4131-b878-bdff8d32fdad': 'Optimize DB Query (single shot, developer trust)',
  'e3a84e03-5f24-435f-b5cf-57fcd8bcb463': 'Off-by-One Bugfix (single shot, ship fast)',
  '0c4948c4-dbee-45a2-bc94-5aaf04102d04': 'Caching PR Review (single shot, developer trust)',
  '2d97e235-30dc-461c-9435-b5dba144c3aa': 'Caching PR Review (agent loop, developer trust)',
  '10608145-5e70-4077-a417-75fadc66030d': 'Refactor Callbacks (single shot, developer trust)',
  '5fccd0ae-f8f0-4719-ac07-d7f637e8a491': 'Refactor Callbacks (agent loop, developer trust)',
  '3c6501c0-9b6f-4562-afd6-eec860f44683': 'Memory Leak (single shot, developer trust)',
  '3a64f713-bf3f-4bfb-b0bb-90dbf8127069': 'Memory Leak (agent loop, developer trust)',
  'e7b91243-801b-45ea-96e5-8abf6a4883eb': 'Dark Mode (single shot, developer trust)',
  '90c16c1e-803c-4227-a6d3-60a5a905ab46': 'Dark Mode (single shot, ship fast)',
};

// ── Insight definitions ──

const INSIGHTS = [
  { num: 1, title: 'Context utilization is the biggest differentiator' },
  { num: 2, title: 'Same-family judge bias is real and measurable' },
  { num: 3, title: 'Agent loops fix hallucination but not judgment' },
  { num: 4, title: 'Explanation quality is necessary but not sufficient' },
  { num: 5, title: 'Judge agreement correlates with objectivity' },
  { num: 6, title: 'Edge case handling is the most volatile dimension' },
  { num: 7, title: 'Correctness has the most critical judge disagreements' },
  { num: 8, title: 'Weight presets change winners — philosophy is a design variable' },
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
      <div className="mb-10">
        <h1 className="text-3xl font-semibold tracking-tight text-black">
          What {TOTAL_RUNS} eval runs reveal about coding agents
        </h1>
        <p className="mt-2 text-base text-gray-500">
          Cross-provider dual-judge evaluation across 10 coding tasks and 6 scoring dimensions.
          GPT-5.3 Codex and Claude Opus 4.6 as subjects; Claude Sonnet 4 and GPT-5.2 as judges.
        </p>
      </div>

      {/* Scoreboard */}
      <div className="mb-10 grid grid-cols-4 gap-px overflow-hidden rounded-lg border border-gray-200 bg-gray-200">
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
      <div className="mb-10 rounded-lg border border-gray-200 bg-white">
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
            Largest gap: <strong>context utilization</strong> (+{CONTEXT_GAP.toFixed(2)}).
            Narrowest gap: <strong>explanation quality</strong> (+{EXPLANATION_GAP.toFixed(2)}).
            Codex leads every dimension, but the advantage concentrates on &quot;trust&quot; dimensions — context utilization, correctness, and completeness — where conservative, accurate changes matter most.
          </p>
        </InsightSection>

        {/* Insight 2: Judge bias */}
        <InsightSection
          num={2}
          title="Same-family judge bias is real and measurable"
          implication="Any eval using a single LLM judge inherits systematic bias. Cross-family judging is not optional — it's a correctness requirement. Build dual-judge pipelines by default."
          evidenceRunIds={EVIDENCE.methodology}
        >
          <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-[10px] font-medium uppercase tracking-widest text-amber-600">Claude judged by Sonnet (same family)</div>
                <div className="mt-1 text-2xl font-bold text-amber-700">+{BIAS_STATS.claudePrimaryMinusSecondary.toFixed(2)}</div>
                <div className="text-xs text-amber-600">higher than cross-family judge</div>
              </div>
              <div>
                <div className="text-[10px] font-medium uppercase tracking-widest text-gray-500">Codex judged by GPT-5.2 (same family)</div>
                <div className="mt-1 text-2xl font-bold text-gray-600">{BIAS_STATS.codexPrimaryMinusSecondary.toFixed(2)}</div>
                <div className="text-xs text-gray-500">vs cross-family judge</div>
              </div>
            </div>
          </div>
          <p className="mb-2 text-sm leading-relaxed text-gray-600">
            The same-family judge rated hallucinated bugs, broken API contracts, and incomplete implementations at 4-5/5 — the cross-family judge flagged them.
            This matches published findings on LLM self-preference bias (<a href="https://arxiv.org/abs/2410.21819" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">ICLR 2025</a>, <a href="https://arxiv.org/abs/2508.06709" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">Spiliopoulou et al. 2025</a>).
          </p>
        </InsightSection>

        {/* Insight 3: Agent loops */}
        <InsightSection
          num={3}
          title="Agent loops fix hallucination but not judgment"
          implication="Make loops task-adaptive: mandatory for code review (eliminates hallucination), optional for generation (judgment errors persist regardless of step count)."
          evidenceRunIds={EVIDENCE.finding2}
        >
          <div className="mb-3 overflow-hidden rounded-md border border-gray-200">
            <table className="w-full text-sm">
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
          <p className="mb-2 text-sm leading-relaxed text-gray-600">
            Caching PR review: the loop caught a hallucinated bug (+{AGENT_LOOP_DELTAS[0].delta.toFixed(2)}).
            Refactor task: the same API-breaking flaw persisted across all 5 steps (+{AGENT_LOOP_DELTAS[1].delta.toFixed(2)}).
            Loops help agents self-correct on factual errors but don&apos;t fix flawed design judgment.
          </p>
        </InsightSection>

        {/* Insight 4: Explanation quality */}
        <InsightSection
          num={4}
          title="Explanation quality is necessary but not sufficient"
          implication="Two product archetypes emerge: the pair programmer (explains what to do, human verifies) and the delegated agent (does it correctly, minimal explanation needed). For autonomous delegation, correctness matters more than explanation."
          evidenceRunIds={EVIDENCE.finding3}
        >
          <div className="mb-3 grid grid-cols-2 gap-3">
            <div className="rounded-md border border-gray-200 bg-white p-4">
              <div className="mb-2 text-[10px] font-medium uppercase tracking-widest text-gray-400">
                Pair Programmer Archetype
              </div>
              <div className="space-y-1 text-sm text-gray-600">
                <div>Explanation: <strong className="text-black">{CLAUDE_DIMS.explanation_quality.toFixed(2)}</strong>/5</div>
                <div>Correctness: <strong className="text-black">{CLAUDE_DIMS.correctness.toFixed(2)}</strong>/5</div>
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
            Objective dimensions (explanation quality, style adherence) see high agreement. Subjective ones (context utilization) see the most disagreement — exactly where the scoring gap is largest.
          </p>
        </InsightSection>

        {/* Insight 6: Edge case volatility */}
        <InsightSection
          num={6}
          title="Edge case handling is the most volatile dimension"
          implication="Edge case handling scores are noisy enough that a single eval run can't be trusted. Run multiple evaluations and report variance, not just means. Flag high-variance dimensions in the UI."
          evidenceRunIds={EVIDENCE.insight6}
        >
          <div className="mb-4 grid grid-cols-2 gap-3">
            <div className="rounded-md border border-gray-200 bg-white p-4 text-center">
              <div className="text-[10px] font-medium uppercase tracking-widest text-gray-400">Codex edge case range</div>
              <div className="mt-2 text-2xl font-bold text-gray-800">{EDGE_CASE_RANGE.codexMin.toFixed(1)} – {EDGE_CASE_RANGE.codexMax.toFixed(1)}</div>
              <div className="mt-1 text-xs text-gray-500">across tasks (avg {CODEX_DIMS.edge_case_handling.toFixed(2)})</div>
            </div>
            <div className="rounded-md border border-gray-200 bg-white p-4 text-center">
              <div className="text-[10px] font-medium uppercase tracking-widest text-gray-400">Claude edge case range</div>
              <div className="mt-2 text-2xl font-bold text-gray-800">{EDGE_CASE_RANGE.claudeMin.toFixed(1)} – {EDGE_CASE_RANGE.claudeMax.toFixed(1)}</div>
              <div className="mt-1 text-xs text-gray-500">across tasks (avg {CLAUDE_DIMS.edge_case_handling.toFixed(2)})</div>
            </div>
          </div>
          <p className="text-sm leading-relaxed text-gray-600">
            Edge case handling has a wider score range than any other dimension for both agents. A 2.0–5.0 spread means the &quot;average&quot; is misleading — task type determines edge case performance more than model choice.
          </p>
        </InsightSection>

        {/* Insight 7: Correctness disagreements */}
        <InsightSection
          num={7}
          title="Correctness has the most critical judge disagreements"
          implication="When judges disagree on correctness, the stakes are highest — a false positive means shipping broken code. Surface correctness disagreements prominently and require human review when judges split."
          evidenceRunIds={EVIDENCE.insight7}
        >
          <div className="mb-4 rounded-lg border border-red-100 bg-red-50 p-4">
            <div className="grid grid-cols-3 gap-4 text-center">
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
          title="Weight presets change winners — philosophy is a design variable"
          implication="There is no single 'best' agent — it depends on what you value. Eval frameworks should make weight presets explicit and let teams encode their own product philosophy into scoring."
          evidenceRunIds={EVIDENCE.insight8}
        >
          <div className="mb-4 grid grid-cols-2 gap-3">
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
            Ship_fast concentrates weight on correctness and completeness — both high-agreement dimensions. Developer_trust distributes weight across context and edge cases — the most contentious dimensions. The preset itself encodes a product philosophy.
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
              but omitted it from the final output — no error, no explanation. The judge scored the output
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
          <div className="mb-4 grid grid-cols-2 gap-3">
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
            Open-ended tasks (refactor this, add this feature) show 4x higher variance — making single-run comparisons unreliable.
          </p>
        </InsightSection>

      </div>

      {/* ── Methodology (collapsed, slimmed) ── */}
      <div className="mt-10 border-t border-gray-200 pt-8">
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
              </p>
              <p className="mb-3">
                <strong>Judges:</strong> Cross-provider dual judges — Claude Sonnet 4 and GPT-5.2 score every run independently.
                Each judge evaluates both agents to control for prompt sensitivity. Final scores average across judges.
              </p>
              <p className="mb-3">
                <strong>Weight presets:</strong> Two presets encode different product philosophies (ship_fast: correctness-heavy; developer_trust: context-heavy).
                See <a href="#insight-8" className="text-blue-600 underline">Insight 8</a> for details.
              </p>
              <p>
                <strong>References:</strong>{' '}
                <a href="https://arxiv.org/abs/2410.21819" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">ICLR 2025 — LLM self-preference bias</a>{' · '}
                <a href="https://arxiv.org/abs/2508.06709" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">Spiliopoulou et al. 2025</a>
              </p>
            </div>
          </div>
        )}
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
