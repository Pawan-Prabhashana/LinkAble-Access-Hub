'use client';

import { useState } from 'react';
import {
  Bot, RefreshCw, AlertTriangle, Bell, BellOff, Users,
  UserCheck, ChevronDown, ChevronRight, ClipboardCopy,
  CheckCircle2, Zap, Cpu, ListChecks, Wrench, ShieldAlert,
} from 'lucide-react';
import { CopilotEscalationLevel } from '@/types/request';

// ── Escalation badge ──────────────────────────────────────────────────────────

const ESCALATION_CONFIG: Record<
  CopilotEscalationLevel,
  { label: string; color: string; icon: React.ElementType; ring: string }
> = {
  NORMAL:   { label: 'Normal',   color: 'bg-slate-100 text-slate-600',  icon: CheckCircle2, ring: 'ring-slate-200' },
  URGENT:   { label: 'Urgent',   color: 'bg-amber-100 text-amber-700',  icon: Zap,          ring: 'ring-amber-200' },
  CRITICAL: { label: 'Critical', color: 'bg-red-100 text-red-700',      icon: ShieldAlert,  ring: 'ring-red-300'   },
  ESCALATE: { label: 'Escalate', color: 'bg-orange-100 text-orange-700',icon: AlertTriangle,ring: 'ring-orange-200' },
};

function EscalationBadge({ level }: { level: CopilotEscalationLevel }) {
  const cfg = ESCALATION_CONFIG[level] ?? ESCALATION_CONFIG.NORMAL;
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ring-1 ${cfg.color} ${cfg.ring}`}>
      <Icon className="h-3.5 w-3.5" />
      {cfg.label}
    </span>
  );
}

// ── Engine chip ───────────────────────────────────────────────────────────────

function EngineChip({ engine }: { engine: string }) {
  const isLlm = engine === 'llm';
  return (
    <span
      title={isLlm ? 'Powered by LLM (OpenAI)' : 'Rules-based engine (offline)'}
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold
        ${isLlm ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-500'}`}
    >
      {isLlm ? <><Zap className="h-2.5 w-2.5" /> LLM</> : <><Cpu className="h-2.5 w-2.5" /> Rules</>}
    </span>
  );
}

// ── Copy button ───────────────────────────────────────────────────────────────

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };
  return (
    <button
      onClick={copy}
      className="flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-medium text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
    >
      {copied
        ? <><CheckCircle2 className="h-3 w-3 text-green-500" /> Copied</>
        : <><ClipboardCopy className="h-3 w-3" /> Copy</>
      }
    </button>
  );
}

// ── Collapsible section ───────────────────────────────────────────────────────

function Collapsible({
  title, icon: Icon, defaultOpen = true, children, badge,
}: {
  title: string;
  icon: React.ElementType;
  defaultOpen?: boolean;
  children: React.ReactNode;
  badge?: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-lg border border-slate-100">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-slate-50 transition-colors rounded-lg"
      >
        <div className="flex items-center gap-2">
          <Icon className="h-3.5 w-3.5 text-slate-400" />
          <span className="text-xs font-semibold text-slate-700">{title}</span>
          {badge}
        </div>
        {open
          ? <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
          : <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
        }
      </button>
      {open && <div className="border-t border-slate-100 px-4 py-3">{children}</div>}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

interface Props {
  // Copilot data
  copilotSummary?: string | null;
  copilotSuggestedActions?: string[] | null;
  copilotResolutionSteps?: string[] | null;
  copilotRecommendedTeam?: string | null;
  copilotRecommendedAssignee?: string | null;
  copilotEscalationLevel?: CopilotEscalationLevel | null;
  copilotShouldAlert?: boolean | null;
  copilotAlertReason?: string | null;
  copilotDraftInternalNote?: string | null;
  copilotDecisionTrace?: string[] | null;
  copilotEngine?: string | null;
  copilotGeneratedAt?: string | null;
  // Actions
  onRunCopilot?: () => void;
  isRunning?: boolean;
  onAcceptTeam?: (team: string, assignee: string) => void;
  onUseInternalNote?: (note: string) => void;
}

export default function CopilotPanel({
  copilotSummary,
  copilotSuggestedActions,
  copilotResolutionSteps,
  copilotRecommendedTeam,
  copilotRecommendedAssignee,
  copilotEscalationLevel,
  copilotShouldAlert,
  copilotAlertReason,
  copilotDraftInternalNote,
  copilotDecisionTrace,
  copilotEngine,
  copilotGeneratedAt,
  onRunCopilot,
  isRunning = false,
  onAcceptTeam,
  onUseInternalNote,
}: Props) {
  const hasData = copilotSummary || copilotRecommendedTeam || copilotEscalationLevel;

  // ── Empty / pending state ─────────────────────────────────────────────────
  if (!hasData) {
    return (
      <div className="rounded-xl border border-dashed border-emerald-200 bg-emerald-50/30 p-6">
        <div className="mb-4 flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100">
            <Bot className="h-4 w-4 text-emerald-600" />
          </div>
          <div>
            <p className="text-sm font-bold text-emerald-700">Operations Copilot</p>
            <p className="text-xs text-emerald-500">Agentic workflow not yet generated</p>
          </div>
        </div>
        <p className="mb-5 text-sm text-slate-500">
          Run the copilot to get team assignment recommendations, escalation decision, 
          suggested actions, and a draft internal note — all in one click.
        </p>
        {onRunCopilot && (
          <button
            onClick={onRunCopilot}
            disabled={isRunning}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50 transition-colors"
          >
            {isRunning
              ? <><RefreshCw className="h-4 w-4 animate-spin" /> Generating…</>
              : <><Bot className="h-4 w-4" /> Run Copilot</>
            }
          </button>
        )}
      </div>
    );
  }

  const escalationLevel = (copilotEscalationLevel ?? 'NORMAL') as CopilotEscalationLevel;
  const isCritical = escalationLevel === 'CRITICAL' || escalationLevel === 'ESCALATE';

  // ── Populated state ───────────────────────────────────────────────────────
  return (
    <div className={`rounded-xl ring-1 overflow-hidden ${
      isCritical
        ? 'bg-gradient-to-br from-red-50 via-white to-white ring-red-200'
        : escalationLevel === 'URGENT'
        ? 'bg-gradient-to-br from-amber-50 via-white to-white ring-amber-200'
        : 'bg-gradient-to-br from-emerald-50 via-white to-white ring-emerald-100'
    }`}>

      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
        <div className="flex items-center gap-2.5">
          <div className={`flex h-7 w-7 items-center justify-center rounded-full ${
            isCritical ? 'bg-red-100' : 'bg-emerald-100'
          }`}>
            <Bot className={`h-4 w-4 ${isCritical ? 'text-red-600' : 'text-emerald-600'}`} />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-800">Operations Copilot</p>
            {copilotEngine && <EngineChip engine={copilotEngine} />}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <EscalationBadge level={escalationLevel} />
          {onRunCopilot && (
            <button
              onClick={onRunCopilot}
              disabled={isRunning}
              className="flex items-center gap-1 rounded-md px-2 py-1.5 text-[10px] font-medium text-slate-400 hover:bg-slate-100 transition-colors"
            >
              <RefreshCw className={`h-3 w-3 ${isRunning ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          )}
        </div>
      </div>

      <div className="space-y-3 p-4">

        {/* Alert banner */}
        {copilotShouldAlert && (
          <div className={`flex items-start gap-3 rounded-lg p-3 ${
            escalationLevel === 'CRITICAL'
              ? 'bg-red-50 ring-1 ring-red-200'
              : 'bg-orange-50 ring-1 ring-orange-200'
          }`}>
            <Bell className={`mt-0.5 h-4 w-4 shrink-0 ${
              escalationLevel === 'CRITICAL' ? 'text-red-600' : 'text-orange-600'
            }`} />
            <div>
              <p className={`text-xs font-bold ${
                escalationLevel === 'CRITICAL' ? 'text-red-700' : 'text-orange-700'
              }`}>
                Alert Recommended
              </p>
              {copilotAlertReason && (
                <p className="mt-0.5 text-xs text-slate-600">{copilotAlertReason}</p>
              )}
            </div>
          </div>
        )}

        {!copilotShouldAlert && escalationLevel === 'NORMAL' && (
          <div className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2">
            <BellOff className="h-3.5 w-3.5 text-slate-400" />
            <p className="text-xs text-slate-400">No alert required — standard handling</p>
          </div>
        )}

        {/* Copilot summary */}
        {copilotSummary && (
          <div className="rounded-lg bg-white px-4 py-3 ring-1 ring-slate-100">
            <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              Situation Brief
            </p>
            <p className="text-sm leading-relaxed text-slate-700">{copilotSummary}</p>
          </div>
        )}

        {/* Team recommendation */}
        {copilotRecommendedTeam && (
          <div className="rounded-lg bg-white px-4 py-3 ring-1 ring-slate-100">
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              Recommended Assignment
            </p>
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-blue-500" />
                  <span className="text-sm font-semibold text-slate-800">{copilotRecommendedTeam}</span>
                </div>
                {copilotRecommendedAssignee && (
                  <div className="mt-1 flex items-center gap-2 pl-6">
                    <UserCheck className="h-3 w-3 text-slate-400" />
                    <span className="text-xs text-slate-500">{copilotRecommendedAssignee}</span>
                  </div>
                )}
              </div>
              {onAcceptTeam && copilotRecommendedTeam && (
                <button
                  onClick={() => onAcceptTeam(copilotRecommendedTeam!, copilotRecommendedAssignee ?? '')}
                  className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 transition-colors"
                >
                  <CheckCircle2 className="h-3 w-3" /> Accept
                </button>
              )}
            </div>
          </div>
        )}

        {/* Suggested actions */}
        {copilotSuggestedActions && copilotSuggestedActions.length > 0 && (
          <Collapsible title="Suggested Next Actions" icon={ListChecks}>
            <ol className="space-y-2">
              {copilotSuggestedActions.map((action, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-100 text-[10px] font-bold text-blue-700">
                    {i + 1}
                  </span>
                  <p className="text-sm text-slate-700">{action}</p>
                </li>
              ))}
            </ol>
          </Collapsible>
        )}

        {/* Resolution steps */}
        {copilotResolutionSteps && copilotResolutionSteps.length > 0 && (
          <Collapsible title="Resolution Procedure" icon={Wrench} defaultOpen={false}>
            <ol className="space-y-2">
              {copilotResolutionSteps.map((step, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[10px] font-bold text-slate-600">
                    {i + 1}
                  </span>
                  <p className="text-sm text-slate-600">{step}</p>
                </li>
              ))}
            </ol>
          </Collapsible>
        )}

        {/* Draft internal note */}
        {copilotDraftInternalNote && (
          <Collapsible title="Draft Internal Note" icon={ClipboardCopy} defaultOpen={false}>
            <div className="relative">
              <p className="rounded-lg bg-slate-50 p-3 pr-20 text-sm italic leading-relaxed text-slate-600">
                {copilotDraftInternalNote}
              </p>
              <div className="absolute right-2 top-2 flex flex-col gap-1">
                <CopyButton text={copilotDraftInternalNote} />
                {onUseInternalNote && (
                  <button
                    onClick={() => onUseInternalNote(copilotDraftInternalNote)}
                    className="flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-medium text-blue-500 hover:bg-blue-50 transition-colors"
                  >
                    <CheckCircle2 className="h-3 w-3" /> Use
                  </button>
                )}
              </div>
            </div>
          </Collapsible>
        )}

        {/* Decision trace */}
        {copilotDecisionTrace && copilotDecisionTrace.length > 0 && (
          <Collapsible title="Decision Trace" icon={Bot} defaultOpen={false}
            badge={
              <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-500">
                {copilotDecisionTrace.length} steps
              </span>
            }
          >
            <ol className="space-y-1.5">
              {copilotDecisionTrace.map((step, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-slate-500">
                  <span className="mt-0.5 text-slate-300">#{i + 1}</span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </Collapsible>
        )}

        {/* Footer timestamp */}
        {copilotGeneratedAt && (
          <p className="text-right text-[10px] text-slate-300">
            Generated {new Date(copilotGeneratedAt).toLocaleTimeString()}
          </p>
        )}
      </div>
    </div>
  );
}
