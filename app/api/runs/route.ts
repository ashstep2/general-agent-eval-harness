import { NextResponse } from 'next/server';
import { loadAllRuns } from '@/lib/runs/storage';

export const dynamic = 'force-dynamic';

/** GET /api/runs: return all persisted evaluation runs. */
export async function GET() {
  const runs = await loadAllRuns();
  return NextResponse.json(runs);
}
