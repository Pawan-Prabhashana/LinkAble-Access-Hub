'use client';

import { useState } from 'react';
import { KnowledgeArticle } from '@/types/notification';
import { BookOpen, ChevronDown, ChevronUp, Clock, FileText, ExternalLink } from 'lucide-react';

interface Props {
  articles: KnowledgeArticle[];
  loading?: boolean;
}

function ArticleCard({ article }: { article: KnowledgeArticle }) {
  const [expanded, setExpanded] = useState(false);
  const score = Math.min(100, Math.round((article.relevance_score / 10) * 100));

  return (
    <div className="rounded-lg border border-emerald-100 bg-white overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-start justify-between gap-3 px-4 py-3 text-left hover:bg-emerald-50/50 transition-colors"
      >
        <div className="flex items-start gap-2.5 min-w-0">
          <FileText className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" />
          <div className="min-w-0">
            <p className="text-xs font-semibold text-slate-800 leading-snug">{article.title}</p>
            <div className="mt-1 flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-medium text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                {article.sop_ref}
              </span>
              <span className="flex items-center gap-1 text-[10px] text-slate-400">
                <Clock className="h-2.5 w-2.5" /> {article.resolution_time}
              </span>
              <span className={`text-[10px] font-medium ${
                score >= 70 ? 'text-green-600' : score >= 40 ? 'text-amber-600' : 'text-slate-400'
              }`}>
                {score}% match
              </span>
            </div>
          </div>
        </div>
        {expanded
          ? <ChevronUp className="h-3.5 w-3.5 shrink-0 text-slate-400" />
          : <ChevronDown className="h-3.5 w-3.5 shrink-0 text-slate-400" />
        }
      </button>
      {expanded && (
        <div className="border-t border-emerald-50 px-4 pb-4 pt-3">
          <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line">
            {article.content}
          </p>
        </div>
      )}
    </div>
  );
}

export default function GuidancePanel({ articles, loading = false }: Props) {
  if (loading) {
    return (
      <div className="rounded-xl border border-emerald-100 bg-emerald-50/30 p-5">
        <div className="flex items-center gap-2 mb-3">
          <BookOpen className="h-4 w-4 text-emerald-500 animate-pulse" />
          <span className="text-xs font-semibold uppercase tracking-wider text-emerald-600">
            Retrieving guidance…
          </span>
        </div>
        <div className="space-y-2">
          {[1,2].map(i => (
            <div key={i} className="h-12 rounded-lg bg-emerald-100/50 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!articles.length) {
    return (
      <div className="rounded-xl border border-dashed border-emerald-200 bg-emerald-50/20 p-5">
        <div className="flex items-center gap-2 mb-2">
          <BookOpen className="h-4 w-4 text-emerald-400" />
          <span className="text-xs font-semibold uppercase tracking-wider text-emerald-500">
            Relevant Guidance
          </span>
        </div>
        <p className="text-xs italic text-slate-400">No relevant SOPs found for this request context.</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl bg-gradient-to-br from-emerald-50 via-white to-white p-5 ring-1 ring-emerald-100">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100">
            <BookOpen className="h-3.5 w-3.5 text-emerald-600" />
          </div>
          <span className="text-xs font-semibold uppercase tracking-wider text-emerald-600">
            Relevant Guidance
          </span>
          <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
            {articles.length} SOP{articles.length !== 1 ? 's' : ''} retrieved
          </span>
        </div>
        <span className="text-[10px] text-slate-400 flex items-center gap-1">
          <ExternalLink className="h-2.5 w-2.5" /> RAG Knowledge Base
        </span>
      </div>

      <div className="space-y-2">
        {articles.map(a => <ArticleCard key={a.id} article={a} />)}
      </div>

      <p className="mt-3 text-[10px] text-slate-300 text-right">
        Retrieved from {articles.length} of 12 knowledge articles · Ranked by relevance
      </p>
    </div>
  );
}
