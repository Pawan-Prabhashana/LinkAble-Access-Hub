'use client';

import { RefreshCw, Sparkles, Cpu } from 'lucide-react';
import PriorityBadge from './PriorityBadge';
import AiCategoryBadge from './AiCategoryBadge';

interface Props {
  summary?: string | null;
  aiCategory?: string | null;
  aiPriority?: string | null;
  tags?: string[] | null;
  confidence?: number | null;
  reason?: string | null;
  engine?: string | null;
  analyzedAt?: string | null;
  onReanalyze?: () => void;
  isAnalyzing?: boolean;
}

function EngineChip({ engine }: { engine: string }) {
  const isLlm = engine === 'llm';
  return (
    <span
      title={isLlm ? 'Powered by LLM (OpenAI)' : 'Rules-based classifier (offline)'}
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold tracking-wide
        ${isLlm
          ? 'bg-violet-600 text-white'
          : 'bg-slate-100 text-slate-500'
        }`}
    >
      {isLlm ? (
        <><Sparkles className="h-2.5 w-2.5" /> LLM</>
      ) : (
        <><Cpu className="h-2.5 w-2.5" /> Rules</>
      )}
    </span>
  );
}

export default function AiInsightsPanel({
  summary,
  aiCategory,
  aiPriority,
  tags,
  confidence,
  reason,
  engine,
  analyzedAt,
  onReanalyze,
  isAnalyzing = false,
}: Props) {
  const hasData = summary || aiCategory || aiPriority;

  // ── Empty / pending state ──────────────────────────────────────────────────
  if (!hasData) {
    return (
      <div className="rounded-xl border border-dashed border-violet-200 bg-violet-50/40 p-5">
        <div className="mb-3 flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-violet-100">
            <Sparkles className="h-3.5 w-3.5 text-violet-500" />
          </div>
          <span className="text-xs font-semibold uppercase tracking-wider text-violet-500">
            AI Insights
          </span>
        </div>
        <p className="mb-4 text-sm text-slate-400 italic">
          No analysis yet. Click below to run the AI pipeline.
        </p>
        {onReanalyze && (
          <button
            onClick={onReanalyze}
            disabled={isAnalyzing}
            className="flex items-center gap-2 rounded-lg bg-violet-600 px-3 py-2 text-xs font-semibold text-white hover:bg-violet-700 disabled:opacity-50 transition-colors"
          >
            {isAnalyzing
              ? <RefreshCw className="h-3.5 w-3.5 animate-spin" />
              : <Sparkles className="h-3.5 w-3.5" />
            }
            {isAnalyzing ? 'Analysing…' : 'Run AI Analysis'}
          </button>
        )}
      </div>
    );
  }

  // ── Populated state ────────────────────────────────────────────────────────
  return (
    <div className="rounded-xl bg-gradient-to-br from-violet-50 via-white to-white p-5 ring-1 ring-violet-100">

      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-violet-100">
            <Sparkles className="h-3.5 w-3.5 text-violet-600" />
          </div>
          <span className="text-xs font-semibold uppercase tracking-wider text-violet-600">
            AI Insights
          </span>
          {engine && engine !== 'none' && <EngineChip engine={engine} />}
        </div>

        {onReanalyze && (
          <button
            onClick={onReanalyze}
            disabled={isAnalyzing}
            className="flex items-center gap-1.5 rounded-md px-2 py-1 text-[10px] font-medium text-violet-500 hover:bg-violet-100 disabled:opacity-50 transition-colors"
          >
            <RefreshCw className={`h-3 w-3 ${isAnalyzing ? 'animate-spin' : ''}`} />
            Re-analyse
          </button>
        )}
      </div>

      {/* AI Summary */}
      {summary && (
        <div className="mb-4 rounded-lg bg-white px-4 py-3 ring-1 ring-violet-100">
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-violet-400">
            Summary
          </p>
          <p className="text-sm font-medium text-slate-700">{summary}</p>
        </div>
      )}

      {/* Category + Priority */}
      <div className="mb-4 grid grid-cols-2 gap-3">
        {aiCategory && (
          <div>
            <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              AI Category
            </p>
            <AiCategoryBadge category={aiCategory} />
          </div>
        )}
        {aiPriority && (
          <div>
            <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              AI Priority
            </p>
            <PriorityBadge priority={aiPriority} />
          </div>
        )}
      </div>

      {/* Tags */}
      {tags && tags.length > 0 && (
        <div className="mb-4">
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
            Tags
          </p>
          <div className="flex flex-wrap gap-1.5">
            {tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600"
              >
                #{tag.replace(/_/g, ' ')}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Confidence bar */}
      {confidence != null && (
        <div className="mb-3">
          <div className="mb-1.5 flex items-center justify-between">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              Confidence
            </p>
            <p className={`text-xs font-bold ${
              confidence >= 0.75 ? 'text-green-600'
              : confidence >= 0.5 ? 'text-amber-600'
              : 'text-red-500'
            }`}>
              {Math.round(confidence * 100)}%
            </p>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
            <div
              className={`h-1.5 rounded-full transition-all ${
                confidence >= 0.75 ? 'bg-green-500'
                : confidence >= 0.5 ? 'bg-amber-500'
                : 'bg-red-400'
              }`}
              style={{ width: `${Math.round(confidence * 100)}%` }}
            />
          </div>
        </div>
      )}

      {/* Reasoning */}
      {reason && (
        <div className="rounded-lg bg-slate-50 px-3 py-2.5">
          <p className="mb-0.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
            Reasoning
          </p>
          <p className="text-xs italic text-slate-500">{reason}</p>
        </div>
      )}

      {/* Timestamp */}
      {analyzedAt && (
        <p className="mt-3 text-right text-[10px] text-slate-300">
          Analysed {new Date(analyzedAt).toLocaleTimeString()}
        </p>
      )}
    </div>
  );
}
