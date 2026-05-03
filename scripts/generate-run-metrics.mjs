import fs from 'fs';
import path from 'path';

const RUNS_DIR = path.join(process.cwd(), 'outputs', 'runs');
const JSON_OUT = path.join(process.cwd(), 'outputs', 'latest-run-metrics.json');
const MD_OUT = path.join(process.cwd(), 'outputs', 'latest-run-metrics.md');

// New flagship matchup (post-Mar 2026)
const NEW_OPENAI = 'gpt-5.5';
const NEW_ANTHROPIC = 'claude-opus-4-7';

// Historical baseline matchup (pre-flagship-bump)
const OLD_OPENAI = 'gpt-5.3-codex';
const OLD_ANTHROPIC = 'claude-opus-4-6';

function avg(values) {
  if (values.length === 0) return 0;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

function toPct(value) {
  return `${(value * 100).toFixed(1)}%`;
}

function loadRuns() {
  if (!fs.existsSync(RUNS_DIR)) return [];
  return fs
    .readdirSync(RUNS_DIR)
    .filter((file) => file.endsWith('.json'))
    .map((file) => {
      const raw = fs.readFileSync(path.join(RUNS_DIR, file), 'utf-8');
      return JSON.parse(raw);
    });
}

/**
 * Per-dimension averages for one model across a set of runs.
 * Uses the cross-family judge's scores (the ranking score), not the same-family one.
 */
function dimensionAverages(runs, modelId) {
  const sums = {};
  const counts = {};

  for (const run of runs) {
    const model = run.modelResults?.[modelId];
    if (!model?.dimensionAverages) continue;
    for (const [dim, score] of Object.entries(model.dimensionAverages)) {
      sums[dim] = (sums[dim] || 0) + score;
      counts[dim] = (counts[dim] || 0) + 1;
    }
  }

  const result = {};
  for (const dim of Object.keys(sums)) {
    result[dim] = sums[dim] / counts[dim];
  }
  return result;
}

/**
 * Same-family vs cross-family scoring delta.
 * For Anthropic models: primary (Sonnet) is same-family, secondary (GPT) is cross-family.
 * For OpenAI models: secondary (GPT) is same-family, primary (Sonnet) is cross-family.
 * Returns the average (sameFamilyOverall - crossFamilyOverall) per model.
 */
function sameFamilyBias(runs, modelId, provider) {
  const deltas = [];
  for (const run of runs) {
    const model = run.modelResults?.[modelId];
    if (!model) continue;
    const primary = model.primary?.overallScore;
    const secondary = model.secondary?.overallScore;
    if (primary == null || secondary == null) continue;
    const sameFamily = provider === 'anthropic' ? primary : secondary;
    const crossFamily = provider === 'anthropic' ? secondary : primary;
    deltas.push(sameFamily - crossFamily);
  }
  return avg(deltas);
}

/**
 * Per-dimension inter-judge agreement (% of runs where the two judges scored within 1 pt).
 */
function dimensionAgreement(runs, modelId) {
  const dimWithinOne = {};
  const dimTotal = {};

  for (const run of runs) {
    const model = run.modelResults?.[modelId];
    if (!model) continue;
    const primaryDims = model.primary?.dimensionScores || [];
    const secondaryDims = model.secondary?.dimensionScores || [];
    for (const p of primaryDims) {
      const s = secondaryDims.find((d) => d.dimension === p.dimension);
      if (!s) continue;
      const within = Math.abs(p.score - s.score) <= 1;
      dimWithinOne[p.dimension] = (dimWithinOne[p.dimension] || 0) + (within ? 1 : 0);
      dimTotal[p.dimension] = (dimTotal[p.dimension] || 0) + 1;
    }
  }

  const result = {};
  for (const dim of Object.keys(dimTotal)) {
    result[dim] = dimWithinOne[dim] / dimTotal[dim];
  }
  return result;
}

function summarizeMatchup(runs, openaiId, anthropicId, label) {
  const headToHead = runs.filter(
    (run) => run.models.includes(openaiId) && run.models.includes(anthropicId),
  );
  const openaiWins = headToHead.filter((run) => run.winner === openaiId).length;
  const anthropicWins = headToHead.filter((run) => run.winner === anthropicId).length;
  const avgGap = avg(
    headToHead.map((run) => {
      const o = run.modelResults?.[openaiId]?.weightedScore || 0;
      const a = run.modelResults?.[anthropicId]?.weightedScore || 0;
      return o - a;
    }),
  );
  const avgAgreement = avg(
    headToHead.map((run) => run.interJudgeAgreement?.alignmentRate || 0),
  );

  const byMode = headToHead.reduce((acc, run) => {
    acc[run.mode] = (acc[run.mode] || 0) + 1;
    return acc;
  }, {});

  return {
    label,
    openaiId,
    anthropicId,
    runCount: headToHead.length,
    openaiWins,
    anthropicWins,
    averageWeightedGapOpenaiMinusAnthropic: avgGap,
    averageInterJudgeAgreement: avgAgreement,
    byMode,
    openaiDimensions: dimensionAverages(headToHead, openaiId),
    anthropicDimensions: dimensionAverages(headToHead, anthropicId),
    openaiSameFamilyBias: sameFamilyBias(headToHead, openaiId, 'openai'),
    anthropicSameFamilyBias: sameFamilyBias(headToHead, anthropicId, 'anthropic'),
    dimensionAgreement: {
      openai: dimensionAgreement(headToHead, openaiId),
      anthropic: dimensionAgreement(headToHead, anthropicId),
    },
    runIds: headToHead.map((r) => r.id),
  };
}

function summarize(runs) {
  const byMode = runs.reduce((acc, run) => {
    acc[run.mode] = (acc[run.mode] || 0) + 1;
    return acc;
  }, {});
  const byPreset = runs.reduce((acc, run) => {
    acc[run.weightPreset] = (acc[run.weightPreset] || 0) + 1;
    return acc;
  }, {});

  return {
    generatedAt: new Date().toISOString(),
    runCount: runs.length,
    byMode,
    byPreset,
    matchups: {
      newFlagship: summarizeMatchup(runs, NEW_OPENAI, NEW_ANTHROPIC, 'GPT-5.5 vs Claude Opus 4.7'),
      historicalBaseline: summarizeMatchup(runs, OLD_OPENAI, OLD_ANTHROPIC, 'GPT-5.3 Codex vs Claude Opus 4.6'),
    },
  };
}

function fmtMatchup(m) {
  const lines = [
    `## ${m.label}`,
    '',
    `- Head-to-head runs: ${m.runCount}`,
    `- ${m.openaiId} wins: ${m.openaiWins}`,
    `- ${m.anthropicId} wins: ${m.anthropicWins}`,
    `- Avg weighted gap (${m.openaiId} − ${m.anthropicId}): ${m.averageWeightedGapOpenaiMinusAnthropic.toFixed(2)}`,
    `- Avg inter-judge agreement: ${toPct(m.averageInterJudgeAgreement)}`,
    `- Same-family bias (OpenAI judging OpenAI): ${m.openaiSameFamilyBias.toFixed(2)}pt over cross-family`,
    `- Same-family bias (Anthropic judging Anthropic): ${m.anthropicSameFamilyBias.toFixed(2)}pt over cross-family`,
    '',
    '### By mode',
    ...Object.entries(m.byMode).map(([mode, count]) => `- ${mode}: ${count}`),
    '',
    '### Per-dimension averages (cross-family scored)',
    `| Dimension | ${m.openaiId} | ${m.anthropicId} | Gap |`,
    `|---|---|---|---|`,
    ...Object.keys(m.openaiDimensions).map((dim) => {
      const o = m.openaiDimensions[dim];
      const a = m.anthropicDimensions[dim] || 0;
      return `| ${dim} | ${o.toFixed(2)} | ${a.toFixed(2)} | ${(o - a).toFixed(2)} |`;
    }),
    '',
  ];
  return lines.join('\n');
}

function toMarkdown(summary) {
  return [
    '# Latest Run Metrics',
    '',
    `Generated: ${summary.generatedAt}`,
    '',
    `- Total runs (all models, all matchups): ${summary.runCount}`,
    '',
    '## By mode (all runs)',
    ...Object.entries(summary.byMode).map(([mode, count]) => `- ${mode}: ${count}`),
    '',
    '## By preset (all runs)',
    ...Object.entries(summary.byPreset).map(([preset, count]) => `- ${preset}: ${count}`),
    '',
    fmtMatchup(summary.matchups.newFlagship),
    fmtMatchup(summary.matchups.historicalBaseline),
  ].join('\n');
}

const runs = loadRuns();
const summary = summarize(runs);

fs.writeFileSync(JSON_OUT, JSON.stringify(summary, null, 2));
fs.writeFileSync(MD_OUT, toMarkdown(summary));

console.log(`Wrote ${JSON_OUT}`);
console.log(`Wrote ${MD_OUT}`);
