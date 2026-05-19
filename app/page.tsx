'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

export default function Home() {
  const router = useRouter();

  const findings = [
    {
      title: 'Context utilization is the biggest differentiator between agents.',
      description:
        'Agents are closer on correctness than on how well they use the context they\'re given.',
      href: '/insights#insight-1',
    },
    {
      title: 'Agent loops help weak models, hurt strong ones.',
      description:
        'Historical Codex got +1.20 from loops on caching PR review. GPT-5.5 regresses by 0.35; Opus 4.7 holds ceiling at 0.00. Loop value is now model-dependent.',
      href: '/insights#insight-3',
    },
    {
      title: 'Weight presets change winners: philosophy is a design variable.',
      description:
        'How you weight dimensions determines which agent "wins." The eval framework makes this trade-off explicit.',
      href: '/insights#insight-8',
    },
  ];

  return (
    <div className="mx-auto flex max-w-container flex-col gap-14 px-6 py-10 md:gap-16 md:py-12 lg:min-h-[calc(100vh-8rem)] lg:justify-between lg:gap-0 lg:py-4">
      {/* Hero */}
      <div>
        <h1 className="max-w-2xl text-3xl font-semibold tracking-tight text-black sm:text-4xl">
          Coding Agent Eval Harness: Which coding agent should we trust to ship code?
        </h1>
        <p className="mt-3 max-w-xl text-base text-gray-500">
          30 eval runs, 10 coding tasks, 6 dimensions, 2 cross-provider judges: GPT-5.5 vs Claude Opus 4.7 (12 fresh runs) plus the historical Codex / Opus-4.6 baseline (16 runs). Opus 4.7 closed 39% of the gap; agent-loop value is now model-dependent.
        </p>
        <div className="mt-4 flex gap-4">
          <Button onClick={() => router.push('/insights')}>
            View insights
          </Button>
          <Button
            variant="secondary"
            onClick={() => router.push('/agent-eval')}
          >
            Run evals
          </Button>
        </div>
      </div>

      {/* Stats */}
      <section>
        <div className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-gray-200 bg-gray-200 sm:grid-cols-4">
          {[
            { stat: '30', label: 'Eval runs', detail: '12 fresh 5.5/4.7 + 16 baseline + 2 misc' },
            { stat: '10', label: 'Coding tasks', detail: undefined },
            { stat: '6', label: 'Dimensions', detail: undefined },
            { stat: '2', label: 'Cross-provider judges', detail: undefined },
          ].map((item) => (
            <div key={item.label} className="bg-white px-4 py-3">
              <div className="text-xl font-semibold text-black">{item.stat}</div>
              <div className="text-sm font-medium text-black">{item.label}</div>
              {item.detail ? (
                <div className="mt-0.5 text-xs text-gray-500">{item.detail}</div>
              ) : null}
            </div>
          ))}
        </div>
      </section>

      {/* Key Findings */}
      <section>
        <h2 className="mb-3 text-sm font-medium uppercase tracking-wide text-gray-400">
          Key findings
        </h2>
        <div className="grid gap-3 sm:grid-cols-3">
          {findings.map((finding, i) => (
            <button
              key={i}
              onClick={() => router.push(finding.href)}
              className="group flex flex-col justify-between rounded-lg border border-gray-200 bg-white p-3 text-left transition-colors hover:border-gray-400"
            >
              <div>
                <h3 className="text-sm font-medium text-black">
                  {finding.title}
                </h3>
                <p className="mt-1.5 text-xs leading-relaxed text-gray-500">
                  {finding.description}
                </p>
              </div>
              <div className="mt-3 text-sm text-blue-600">Read more →</div>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
