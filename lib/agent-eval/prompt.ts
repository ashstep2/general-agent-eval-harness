import { AgentTask } from '@/types';

export function buildContextBlock(task: AgentTask): string {
  return task.contextFiles
    .map((file) => {
      const notes = file.notes ? `\nNotes: ${file.notes}` : '';
      return `File: ${file.path}${notes}\n\n${file.content}`;
    })
    .join('\n\n---\n\n');
}

export function buildSingleShotPrompt(task: AgentTask): string {
  return `You are a coding agent. Your job is to modify the repo files to complete the task.

Task: ${task.title}
Product question: ${task.productQuestion}

Instructions:
- Return a unified diff patch only for repo files.
- After the patch, include a short explanation (3-6 bullets).
- Be concise and follow existing repo style.

Repo context:
${buildContextBlock(task)}

Task details:
${task.prompt}

Expected behavior:
${task.expectedBehavior}
`;
}

/**
 * Multi-step prompt for the agent_loop mode.
 *
 * Every step beyond `analyze` is given the cumulative prior context (all earlier
 * step outputs concatenated and labeled), so that:
 *   - plan builds on analyze
 *   - code follows the plan
 *   - review actually reviews the code from step 3
 *   - final integrates everything
 *
 * Without this, each step ran independently and only `final` saw any prior context,
 * which made the "agent loop" effectively 5 unrelated prompts. See git history.
 */
export function buildStepPrompt(task: AgentTask, step: string, priorOutput?: string): string {
  const base = `You are a coding agent running in multi-step mode.

Task: ${task.title}
Product question: ${task.productQuestion}

Repo context:
${buildContextBlock(task)}

Task details:
${task.prompt}

Expected behavior:
${task.expectedBehavior}
`;

  const priorBlock = priorOutput && priorOutput.trim().length > 0
    ? `\n\nPrior steps:\n${priorOutput}\n`
    : '';

  switch (step) {
    case 'analyze':
      return `${base}\nStep 1 (analyze): Read and analyze relevant files. Summarize key constraints, risks, and which files you'll need to touch. Do not write code yet.`;
    case 'plan':
      return `${base}${priorBlock}\nStep 2 (plan): Building on your analysis above, propose a specific step-by-step plan for the change. Be concrete about file paths and approach. Do not write code yet.`;
    case 'code':
      return `${base}${priorBlock}\nStep 3 (code): Following the plan above, produce the patch. Return a unified diff patch only.`;
    case 'review':
      return `${base}${priorBlock}\nStep 4 (review): Self-review the patch from Step 3 above. Identify risks, edge cases, possible regressions, and anything that should change. Be specific about the diff.`;
    case 'final':
      return `${base}${priorBlock}\nStep 5 (final): Return the final patch and a concise explanation. Incorporate any improvements identified in Step 4. The patch should be your best work, supersedes any earlier attempt.`;
    default:
      return base;
  }
}
