#!/usr/bin/env tsx
/**
 * Batch eval runner — runs the agent eval pipeline directly (no SSE/UI) and
 * writes results to outputs/runs/. Reads .env.local for API keys.
 *
 * Usage:
 *   npx tsx scripts/run-batch-evals.ts                           # default: all tasks, single_shot, gpt-5.5 + opus-4.7
 *   npx tsx scripts/run-batch-evals.ts --models=gpt-5.5,claude-opus-4-7
 *   npx tsx scripts/run-batch-evals.ts --tasks=add-pagination,retry-backoff
 *   npx tsx scripts/run-batch-evals.ts --mode=agent_loop
 *   npx tsx scripts/run-batch-evals.ts --preset=ship_fast
 */

import { config as loadEnv } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

import type { AgentEvalMode, WeightPreset } from '../types/index';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = resolve(__dirname, '..');

// Load .env.local FIRST so providers see the keys when modules import the SDKs.
loadEnv({ path: resolve(projectRoot, '.env.local') });

async function main() {
  // Dynamic imports AFTER env is loaded.
  const { runAgentEvaluation } = await import('../lib/agent-eval/runner');
  const { AGENT_TASKS, AGENT_TASK_MAP } = await import('../lib/agent-eval/tasks');

  // ── arg parsing ──
  const rawArgs = Object.fromEntries(
    process.argv.slice(2)
      .filter((a) => a.startsWith('--'))
      .map((a) => {
        const [k, v] = a.replace(/^--/, '').split('=');
        return [k, v ?? 'true'];
      }),
  );

  const models = (rawArgs.models || 'gpt-5.5,claude-opus-4-7').split(',').map((s) => s.trim());
  const taskIds: string[] = rawArgs.tasks
    ? rawArgs.tasks.split(',').map((s) => s.trim())
    : AGENT_TASKS.map((t) => t.id);
  const mode = (rawArgs.mode || 'single_shot') as AgentEvalMode;
  const preset = (rawArgs.preset || 'developer_trust') as WeightPreset;

  // ── preflight: dual-judge always needs both Anthropic + OpenAI keys ──
  const required: string[] = ['ANTHROPIC_API_KEY', 'OPENAI_API_KEY'];
  if (models.some((m) => m.startsWith('gemini'))) required.push('GOOGLE_API_KEY');

  const missing = Array.from(new Set(required)).filter((k) => !process.env[k]);
  if (missing.length > 0) {
    console.error(`\n❌ Missing required env vars in .env.local: ${missing.join(', ')}`);
    console.error(`   The dual-judge system needs both ANTHROPIC_API_KEY and OPENAI_API_KEY.`);
    console.error(`   Without OPENAI_API_KEY, cross-family scoring breaks.\n`);
    process.exit(1);
  }

  console.log(`\n▶ Batch eval starting`);
  console.log(`  Models: ${models.join(', ')}`);
  console.log(`  Tasks:  ${taskIds.length}`);
  console.log(`  Mode:   ${mode}`);
  console.log(`  Preset: ${preset}\n`);

  const startedAt = Date.now();
  let runCount = 0;
  let failCount = 0;
  const completedRunIds: string[] = [];

  for (const taskId of taskIds) {
    const task = AGENT_TASK_MAP[taskId];
    if (!task) {
      console.warn(`  ⚠ Skipping unknown task: ${taskId}`);
      continue;
    }

    process.stdout.write(`  [${++runCount}/${taskIds.length}] ${task.title} ... `);
    const taskStart = Date.now();

    try {
      let runId: string | null = null;
      for await (const event of runAgentEvaluation(task, models, mode, preset)) {
        if (event.type === 'complete') {
          runId = (event.data as { id: string }).id;
        }
      }

      const ms = Date.now() - taskStart;
      console.log(`✓ ${(ms / 1000).toFixed(1)}s — runId: ${runId?.slice(0, 8)}`);
      if (runId) completedRunIds.push(runId);
    } catch (err) {
      failCount += 1;
      console.log(`✗ FAILED`);
      console.error(`     ${err instanceof Error ? err.message : err}`);
    }
  }

  const totalMin = ((Date.now() - startedAt) / 60000).toFixed(1);
  console.log(`\n▶ Batch complete in ${totalMin} min`);
  console.log(`  ${completedRunIds.length} succeeded, ${failCount} failed`);
  if (completedRunIds.length > 0) {
    console.log(`\n  Run IDs:`);
    completedRunIds.forEach((id) => console.log(`    - ${id}`));
    console.log(`\n  Next: npm run metrics  # regenerate aggregated findings`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
