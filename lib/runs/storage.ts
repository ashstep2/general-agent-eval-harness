import fs from 'fs';
import path from 'path';
import { put, list } from '@vercel/blob';
import { AgentEvaluationResults } from '@/types';

const RUNS_DIR = path.join(process.cwd(), 'outputs', 'runs');
const BLOB_PREFIX = 'runs/';

/**
 * Persistence strategy:
 *
 *   - Blob is preferred whenever BLOB_READ_WRITE_TOKEN is configured. This is
 *     the production path on Vercel (where the local filesystem is read-only).
 *   - Filesystem is used in local dev (no Blob token) and as a fallback.
 *   - If neither works, saveRun reports it via SaveResult instead of swallowing
 *     the failure, so the runner can surface "your run wasn't persisted" to
 *     the user instead of silently losing data.
 */

function isVercelRuntime(): boolean {
  return !!process.env.VERCEL;
}

function blobAvailable(): boolean {
  return !!process.env.BLOB_READ_WRITE_TOKEN;
}

function ensureLocalDir() {
  if (!fs.existsSync(RUNS_DIR)) {
    fs.mkdirSync(RUNS_DIR, { recursive: true });
  }
}

export interface SaveResult {
  persisted: boolean;
  backend: 'filesystem' | 'blob' | 'none';
  reason?: string;
}

/**
 * Save an evaluation run. Returns metadata about where it landed (or didn't).
 * Never throws; failure modes are surfaced via SaveResult so callers can tell
 * the user when persistence didn't happen.
 */
export async function saveRun(run: AgentEvaluationResults): Promise<SaveResult> {
  if (blobAvailable()) {
    try {
      await put(`${BLOB_PREFIX}${run.id}.json`, JSON.stringify(run, null, 2), {
        access: 'public',
        contentType: 'application/json',
        addRandomSuffix: false,
        allowOverwrite: true,
      });
      return { persisted: true, backend: 'blob' };
    } catch (err) {
      const reason = err instanceof Error ? err.message : String(err);
      console.warn('[storage] Blob save failed:', reason);
      // On Vercel, filesystem is read-only; no fallback worth attempting.
      if (isVercelRuntime()) {
        return { persisted: false, backend: 'none', reason: `Blob save failed: ${reason}` };
      }
      // Local dev: fall through to filesystem.
    }
  }

  try {
    ensureLocalDir();
    fs.writeFileSync(path.join(RUNS_DIR, `${run.id}.json`), JSON.stringify(run, null, 2));
    return { persisted: true, backend: 'filesystem' };
  } catch (err) {
    const reason = err instanceof Error ? err.message : String(err);
    if (isVercelRuntime()) {
      return {
        persisted: false,
        backend: 'none',
        reason:
          'Vercel filesystem is read-only and BLOB_READ_WRITE_TOKEN is not configured. ' +
          'Add a Vercel Blob store via the dashboard to enable persistence on production runs.',
      };
    }
    return { persisted: false, backend: 'none', reason };
  }
}

/**
 * Load all runs from whichever backend is available.
 * Prefers Blob; falls back to filesystem; returns [] if neither works.
 */
export async function loadAllRuns(): Promise<AgentEvaluationResults[]> {
  if (blobAvailable()) {
    try {
      const { blobs } = await list({ prefix: BLOB_PREFIX });
      const runs = await Promise.all(
        blobs.map(async (b) => {
          try {
            const res = await fetch(b.url);
            if (!res.ok) return null;
            return (await res.json()) as AgentEvaluationResults;
          } catch {
            return null;
          }
        }),
      );
      const valid = runs.filter((r): r is AgentEvaluationResults => r !== null);
      // If Blob returned anything, trust it. Mixing Blob + filesystem in
      // production would be confusing (which is canonical?).
      if (valid.length > 0 || isVercelRuntime()) {
        return valid.sort(
          (a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime(),
        );
      }
    } catch (err) {
      console.warn('[storage] Blob list failed, falling back to filesystem:', err);
    }
  }

  try {
    ensureLocalDir();
    const files = fs.readdirSync(RUNS_DIR).filter((f) => f.endsWith('.json'));
    const runs: AgentEvaluationResults[] = [];
    for (const file of files) {
      try {
        const raw = fs.readFileSync(path.join(RUNS_DIR, file), 'utf-8');
        runs.push(JSON.parse(raw) as AgentEvaluationResults);
      } catch {
        // Skip malformed.
      }
    }
    return runs.sort(
      (a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime(),
    );
  } catch {
    return [];
  }
}
