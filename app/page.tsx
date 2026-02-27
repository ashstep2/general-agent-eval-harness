'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

export default function Home() {
  const router = useRouter();

  const findings = [
    {
      title: 'Context utilization is the biggest differentiator between agents.',
      description:
        'The largest scoring gap isn\'t correctness — it\'s how well agents use the information they\'re given.',
      href: '/insights#insight-1',
    },
    {
      title: 'Agent loops fix hallucination but not judgment.',
      description:
        'Extra reasoning steps help with some failure modes but not others. The data shows where loops help and where they don\'t.',
      href: '/insights#insight-3',
    },
    {
      title: 'Weight presets change winners — philosophy is a design variable.',
      description:
        'How you weight dimensions determines which agent "wins." The eval framework makes this trade-off explicit.',
      href: '/insights#insight-8',
    },
  ];

  return (
    <div className="mx-auto flex h-[calc(100vh-8rem)] max-w-container flex-col justify-between px-6 py-4">
      {/* Hero */}
      <div>
        <h1 className="max-w-2xl text-3xl font-semibold tracking-tight text-black sm:text-4xl">
          Coding Agent Eval Harness: Which coding agent should we trust to ship code?
        </h1>
        <p className="mt-3 max-w-xl text-base text-gray-500">
          16 eval runs, 10 coding tasks, 6 dimensions, 2 cross-provider judges: compare GPT-5.3 Codex vs Claude Opus 4.6 (or any 3 models).
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
        <div className="grid gap-px overflow-hidden rounded-lg border border-gray-200 bg-gray-200 sm:grid-cols-4">
          {[
            { stat: '16', label: 'Eval runs', detail: '10 single-shot, 3 ship_fast, 3 agent loop' },
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
