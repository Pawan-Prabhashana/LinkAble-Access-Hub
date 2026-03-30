'use client';

import { useRef, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  MessageSquare, Send, RotateCcw, CheckCircle2, AlertTriangle,
  Sparkles, ChevronRight, Loader2, Plus, Bot, User,
  Tag, MapPin, Flag, Layers, FileText,
} from 'lucide-react';
import { api } from '@/lib/api';
import { ChatMessage, RequestDraft, ChatIntakeResponse } from '@/types/chat';

// ── Helpers ────────────────────────────────────────────────────────────────

const PRIORITY_COLORS: Record<string, string> = {
  CRITICAL: 'bg-red-100 text-red-700 border-red-200',
  HIGH:     'bg-orange-100 text-orange-700 border-orange-200',
  MEDIUM:   'bg-amber-100 text-amber-700 border-amber-200',
  LOW:      'bg-green-100 text-green-700 border-green-200',
};
const PRIORITY_DOT: Record<string, string> = {
  CRITICAL: 'bg-red-500',
  HIGH:     'bg-orange-500',
  MEDIUM:   'bg-amber-400',
  LOW:      'bg-green-500',
};
const CATEGORY_LABELS: Record<string, string> = {
  PHYSICAL_OBSTRUCTION:        'Physical Obstruction',
  ACCESSIBILITY_EQUIPMENT_ISSUE: 'Equipment Issue',
  NAVIGATION_ASSISTANCE:       'Navigation Assistance',
  UNSAFE_ENVIRONMENT:          'Unsafe Environment',
  FACILITY_ACCESS_ISSUE:       'Facility Access Issue',
  EMERGENCY_SUPPORT:           'Emergency Support',
};

const QUICK_PROMPTS = [
  "There are chairs blocking the accessible entrance near the exam hall.",
  "A student needs help reaching Hall B for the 9am exam.",
  "The lift voice guidance isn't working in the library.",
  "There's a wet floor near the accessible ramp — it looks unsafe.",
  "Someone is trapped and needs emergency support near Staircase C.",
];

function formatTime(d: Date) {
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// ── Draft Card ─────────────────────────────────────────────────────────────

interface DraftCardProps {
  draft: RequestDraft;
  missingFields: string[];
  readyToCreate: boolean;
  engine: string;
  confidence: number;
  onEdit: (field: string, value: string) => void;
  onConfirm: () => void;
  onClear: () => void;
  confirming: boolean;
}

function DraftCard({
  draft, missingFields, readyToCreate,
  engine, confidence,
  onEdit, onConfirm, onClear, confirming,
}: DraftCardProps) {
  const [editing, setEditing] = useState<string | null>(null);
  const [editVal, setEditVal] = useState('');

  const startEdit = (field: string, current: string) => {
    setEditing(field);
    setEditVal(current);
  };

  const commitEdit = (field: string) => {
    onEdit(field, editVal);
    setEditing(null);
  };

  const confidencePct = Math.round((confidence || 0) * 100);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200 bg-gradient-to-r from-violet-50 to-blue-50">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-violet-500" />
          <span className="text-sm font-semibold text-slate-700">Request Draft</span>
          <span className={`ml-1 rounded-full px-2 py-0.5 text-[10px] font-semibold border ${
            engine === 'llm'
              ? 'bg-violet-100 text-violet-700 border-violet-200'
              : 'bg-blue-100 text-blue-700 border-blue-200'
          }`}>
            {engine === 'llm' ? '✦ AI-powered' : '⚡ Rules'}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="text-[10px] text-slate-400 font-medium">Confidence</div>
          <div className="w-16 h-1.5 rounded-full bg-slate-200 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                confidencePct >= 75 ? 'bg-green-500' :
                confidencePct >= 50 ? 'bg-amber-400' : 'bg-red-400'
              }`}
              style={{ width: `${confidencePct}%` }}
            />
          </div>
          <span className="text-[10px] font-bold text-slate-600">{confidencePct}%</span>
        </div>
      </div>

      {/* Fields */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">

        {/* Title */}
        <div className="group">
          <div className="flex items-center gap-1.5 mb-1">
            <FileText className="h-3.5 w-3.5 text-slate-400" />
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Title</span>
          </div>
          {editing === 'title' ? (
            <div className="flex gap-2">
              <input
                className="flex-1 rounded-lg border border-violet-300 bg-violet-50 px-3 py-1.5 text-sm outline-none"
                value={editVal}
                onChange={e => setEditVal(e.target.value)}
                onBlur={() => commitEdit('title')}
                autoFocus
              />
            </div>
          ) : (
            <p
              className="rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-800 font-medium cursor-pointer hover:bg-violet-50 transition-colors border border-transparent hover:border-violet-200"
              onClick={() => startEdit('title', draft.title || '')}
              title="Click to edit"
            >
              {draft.title || <span className="text-slate-400 italic">Not extracted yet…</span>}
            </p>
          )}
        </div>

        {/* Category + Priority row */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <div className="flex items-center gap-1.5 mb-1">
              <Layers className="h-3.5 w-3.5 text-slate-400" />
              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Category</span>
            </div>
            {editing === 'category' ? (
              <select
                className="w-full rounded-lg border border-violet-300 bg-violet-50 px-2 py-1.5 text-xs outline-none"
                value={editVal}
                onChange={e => setEditVal(e.target.value)}
                onBlur={() => commitEdit('category')}
                autoFocus
              >
                {Object.entries(CATEGORY_LABELS).map(([v, l]) => (
                  <option key={v} value={v}>{l}</option>
                ))}
              </select>
            ) : (
              <div
                className="rounded-lg bg-slate-50 px-2.5 py-1.5 text-xs font-medium text-slate-700 cursor-pointer hover:bg-violet-50 transition-colors border border-transparent hover:border-violet-200"
                onClick={() => startEdit('category', draft.category || '')}
              >
                {CATEGORY_LABELS[draft.category || ''] || draft.category || <span className="text-slate-400 italic">Unknown</span>}
              </div>
            )}
          </div>

          <div>
            <div className="flex items-center gap-1.5 mb-1">
              <Flag className="h-3.5 w-3.5 text-slate-400" />
              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Priority</span>
            </div>
            {editing === 'priority' ? (
              <select
                className="w-full rounded-lg border border-violet-300 bg-violet-50 px-2 py-1.5 text-xs outline-none"
                value={editVal}
                onChange={e => setEditVal(e.target.value)}
                onBlur={() => commitEdit('priority')}
                autoFocus
              >
                {['CRITICAL','HIGH','MEDIUM','LOW'].map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            ) : (
              <div
                className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold cursor-pointer transition-all border ${
                  PRIORITY_COLORS[draft.priority || ''] || 'bg-slate-100 text-slate-600 border-slate-200'
                } hover:opacity-80`}
                onClick={() => startEdit('priority', draft.priority || 'MEDIUM')}
              >
                <span className={`h-2 w-2 rounded-full ${PRIORITY_DOT[draft.priority || ''] || 'bg-slate-400'}`} />
                {draft.priority || <span className="italic">Unknown</span>}
              </div>
            )}
          </div>
        </div>

        {/* Location */}
        <div>
          <div className="flex items-center gap-1.5 mb-1">
            <MapPin className="h-3.5 w-3.5 text-slate-400" />
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Location</span>
            {missingFields.includes('location') && (
              <span className="text-[9px] text-amber-600 font-semibold bg-amber-50 rounded px-1 py-0.5">Missing</span>
            )}
          </div>
          {editing === 'location' ? (
            <input
              className="w-full rounded-lg border border-violet-300 bg-violet-50 px-3 py-1.5 text-sm outline-none"
              value={editVal}
              placeholder="e.g. Main Building, Block A, Floor 2"
              onChange={e => setEditVal(e.target.value)}
              onBlur={() => commitEdit('location')}
              autoFocus
            />
          ) : (
            <p
              className={`rounded-lg px-3 py-2 text-sm cursor-pointer hover:bg-violet-50 transition-colors border hover:border-violet-200 ${
                draft.location
                  ? 'bg-slate-50 text-slate-700 border-transparent'
                  : 'bg-amber-50 text-amber-600 border-amber-200 italic'
              }`}
              onClick={() => startEdit('location', draft.location || '')}
            >
              {draft.location || 'Click to add location…'}
            </p>
          )}
        </div>

        {/* AI Summary */}
        {draft.aiSummary && (
          <div>
            <div className="flex items-center gap-1.5 mb-1">
              <Sparkles className="h-3.5 w-3.5 text-violet-400" />
              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">AI Summary</span>
            </div>
            <p className="rounded-lg bg-violet-50 px-3 py-2 text-xs text-violet-700 border border-violet-100">
              {draft.aiSummary}
            </p>
          </div>
        )}

        {/* Tags */}
        {draft.tags && draft.tags.length > 0 && (
          <div>
            <div className="flex items-center gap-1.5 mb-1.5">
              <Tag className="h-3.5 w-3.5 text-slate-400" />
              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Tags</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {draft.tags.map(t => (
                <span key={t} className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-600">
                  {t.replace(/_/g, ' ')}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Missing fields warning */}
        {missingFields.length > 0 && (
          <div className="flex items-start gap-2 rounded-lg bg-amber-50 border border-amber-200 px-3 py-2.5">
            <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
            <div>
              <p className="text-xs font-semibold text-amber-700">Incomplete draft</p>
              <p className="text-[11px] text-amber-600 mt-0.5">
                Missing: {missingFields.join(', ')}. You can provide details in the chat or fill in manually.
              </p>
            </div>
          </div>
        )}

        {/* Ready indicator */}
        {readyToCreate && (
          <div className="flex items-center gap-2 rounded-lg bg-green-50 border border-green-200 px-3 py-2.5">
            <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
            <p className="text-xs font-semibold text-green-700">
              Draft is complete — ready to submit
            </p>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="border-t border-slate-200 px-5 py-4 space-y-2.5 bg-slate-50">
        <button
          onClick={onConfirm}
          disabled={confirming || !draft.title}
          className={`w-full flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold transition-all shadow-sm ${
            readyToCreate
              ? 'bg-gradient-to-r from-blue-600 to-violet-600 text-white hover:from-blue-700 hover:to-violet-700'
              : 'bg-slate-800 text-white hover:bg-slate-700'
          } disabled:opacity-40 disabled:cursor-not-allowed`}
        >
          {confirming ? (
            <><Loader2 className="h-4 w-4 animate-spin" />Creating Request…</>
          ) : (
            <><CheckCircle2 className="h-4 w-4" />{readyToCreate ? 'Confirm & Create Request' : 'Create Request As-Is'}</>
          )}
        </button>
        <button
          onClick={onClear}
          className="w-full flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
        >
          <RotateCcw className="h-3.5 w-3.5" /> Start New Conversation
        </button>
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────

interface UIMessage {
  role: 'user' | 'assistant';
  content: string;
  time: Date;
}

export default function ChatIntakePage() {
  const router = useRouter();
  const bottomRef    = useRef<HTMLDivElement>(null);
  const inputRef     = useRef<HTMLTextAreaElement>(null);

  const [messages,    setMessages]    = useState<UIMessage[]>([]);
  const [input,       setInput]       = useState('');
  const [loading,     setLoading]     = useState(false);
  const [confirming,  setConfirming]  = useState(false);
  const [draft,       setDraft]       = useState<RequestDraft | null>(null);
  const [response,    setResponse]    = useState<ChatIntakeResponse | null>(null);

  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => { scrollToBottom(); }, [messages, scrollToBottom]);

  const chatMessages = (): ChatMessage[] =>
    messages.map(m => ({ role: m.role, content: m.content }));

  const sendMessage = useCallback(async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    const userMsg: UIMessage = { role: 'user', content: trimmed, time: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const history: ChatMessage[] = [...chatMessages(), { role: 'user', content: trimmed }];
      const res = await api.chatIntake({
        messages: history,
        currentDraft: draft,
      });

      setResponse(res);
      if (res.draft) setDraft(res.draft);

      const assistantMsg: UIMessage = {
        role: 'assistant',
        content: res.reply + (res.followUpQuestion ? `\n\n${res.followUpQuestion}` : ''),
        time: new Date(),
      };
      setMessages(prev => [...prev, assistantMsg]);
    } catch (err) {
      const errMsg: UIMessage = {
        role: 'assistant',
        content: "Sorry, I couldn't reach the AI service. Please check the backend is running and try again.",
        time: new Date(),
      };
      setMessages(prev => [...prev, errMsg]);
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [loading, draft, messages]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const handleDraftEdit = (field: string, value: string) => {
    setDraft(prev => prev ? { ...prev, [field]: value } : prev);
  };

  const handleConfirm = async () => {
    if (!draft || confirming) return;
    setConfirming(true);
    try {
      const newRequest = await api.createRequest({
        title:       draft.title || 'Accessibility Issue',
        description: draft.description || '',
        category:    draft.category || 'FACILITY_ACCESS_ISSUE',
        priority:    draft.priority || 'MEDIUM',
        location:    draft.location,
        source:      'ai_chat_intake',
        transcript:  messages
          .filter(m => m.role === 'user')
          .map(m => m.content)
          .join(' | '),
      });
      router.push(`/requests/${newRequest.id}`);
    } catch (err) {
      console.error('Failed to create request', err);
      alert('Failed to create request. Please try again.');
    } finally {
      setConfirming(false);
    }
  };

  const handleClear = () => {
    setMessages([]);
    setDraft(null);
    setResponse(null);
    setInput('');
    inputRef.current?.focus();
  };

  const isEmpty = messages.length === 0;

  return (
    <div className="flex h-full overflow-hidden">
      {/* ── Left: Chat ─────────────────────────────────────────────────────── */}
      <div className="flex flex-col flex-1 min-w-0 border-r border-slate-200 bg-white">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-gradient-to-r from-slate-900 to-slate-800">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500">
              <MessageSquare className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-base font-bold text-white leading-tight">AI Chat Intake</h1>
              <p className="text-[11px] text-slate-400">Describe any accessibility issue — I&apos;ll create a structured request</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {response && (
              <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold border ${
                response.engine === 'llm'
                  ? 'bg-violet-900/50 text-violet-300 border-violet-700'
                  : 'bg-blue-900/50 text-blue-300 border-blue-700'
              }`}>
                {response.engine === 'llm' ? '✦ GPT-4o' : '⚡ Rules Engine'}
              </span>
            )}
            {messages.length > 0 && (
              <button
                onClick={handleClear}
                className="flex items-center gap-1.5 rounded-lg bg-slate-700 px-3 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-600 transition-colors"
              >
                <Plus className="h-3.5 w-3.5" /> New
              </button>
            )}
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {isEmpty ? (
            <div className="flex flex-col items-center justify-center h-full text-center pb-10">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-violet-600 shadow-lg mb-4">
                <Bot className="h-8 w-8 text-white" />
              </div>
              <h2 className="text-lg font-bold text-slate-800 mb-1">AI Intake Assistant</h2>
              <p className="text-sm text-slate-500 max-w-sm mb-8">
                Describe an accessibility barrier in natural language. I&apos;ll understand the issue and create a structured service request automatically.
              </p>
              <div className="w-full max-w-md space-y-2">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-3">Try a quick prompt</p>
                {QUICK_PROMPTS.map((p, i) => (
                  <button
                    key={i}
                    onClick={() => sendMessage(p)}
                    className="w-full text-left rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 transition-all group"
                  >
                    <span className="flex items-start gap-2">
                      <ChevronRight className="h-4 w-4 mt-0.5 text-slate-300 group-hover:text-blue-400 shrink-0" />
                      {p}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((msg, idx) => (
              <div key={idx} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                {/* Avatar */}
                <div className={`shrink-0 flex h-8 w-8 items-center justify-center rounded-full ${
                  msg.role === 'user'
                    ? 'bg-blue-600'
                    : 'bg-gradient-to-br from-violet-500 to-blue-600'
                }`}>
                  {msg.role === 'user'
                    ? <User className="h-4 w-4 text-white" />
                    : <Bot  className="h-4 w-4 text-white" />
                  }
                </div>

                {/* Bubble */}
                <div className={`max-w-[78%] ${msg.role === 'user' ? 'items-end' : 'items-start'} flex flex-col`}>
                  <div className={`rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
                    msg.role === 'user'
                      ? 'bg-blue-600 text-white rounded-tr-sm'
                      : 'bg-slate-100 text-slate-800 rounded-tl-sm'
                  }`}>
                    {msg.content}
                  </div>
                  <span className="mt-1 px-1 text-[10px] text-slate-400">{formatTime(msg.time)}</span>
                </div>
              </div>
            ))
          )}

          {/* Typing indicator */}
          {loading && (
            <div className="flex gap-3">
              <div className="shrink-0 flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-blue-600">
                <Bot className="h-4 w-4 text-white" />
              </div>
              <div className="rounded-2xl rounded-tl-sm bg-slate-100 px-4 py-3">
                <div className="flex gap-1.5 items-center h-5">
                  <span className="h-2 w-2 rounded-full bg-slate-400 animate-bounce [animation-delay:0ms]" />
                  <span className="h-2 w-2 rounded-full bg-slate-400 animate-bounce [animation-delay:150ms]" />
                  <span className="h-2 w-2 rounded-full bg-slate-400 animate-bounce [animation-delay:300ms]" />
                </div>
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="border-t border-slate-200 px-5 py-4 bg-white">
          <div className="flex items-end gap-3">
            <textarea
              ref={inputRef}
              rows={2}
              className="flex-1 resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all placeholder:text-slate-400"
              placeholder="Describe the accessibility issue… (Enter to send, Shift+Enter for new line)"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={loading}
            />
            <button
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || loading}
              className="shrink-0 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm hover:bg-blue-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {loading
                ? <Loader2 className="h-5 w-5 animate-spin" />
                : <Send className="h-5 w-5" />
              }
            </button>
          </div>
          <p className="mt-2 text-[10px] text-slate-400 text-center">
            AI-powered · Works offline · Powered by LinkAble AccessHub v6
          </p>
        </div>
      </div>

      {/* ── Right: Draft ───────────────────────────────────────────────────── */}
      <div className="w-96 shrink-0 flex flex-col bg-white overflow-hidden">
        {draft ? (
          <DraftCard
            draft={draft}
            missingFields={response?.missingFields ?? []}
            readyToCreate={response?.readyToCreate ?? false}
            engine={response?.engine ?? 'rules'}
            confidence={response?.confidence ?? 0.5}
            onEdit={handleDraftEdit}
            onConfirm={handleConfirm}
            onClear={handleClear}
            confirming={confirming}
          />
        ) : (
          <div className="flex flex-col h-full items-center justify-center text-center px-8 bg-gradient-to-b from-slate-50 to-white">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 mb-4">
              <Sparkles className="h-7 w-7 text-slate-300" />
            </div>
            <h3 className="text-sm font-bold text-slate-700 mb-2">No Draft Yet</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Start describing an accessibility issue in the chat. The AI will extract the key details and build a structured request draft here.
            </p>
            <div className="mt-6 w-full space-y-2">
              {['Title', 'Category', 'Priority', 'Location', 'Tags'].map(f => (
                <div key={f} className="flex items-center gap-2.5 rounded-lg bg-slate-100 px-3 py-2">
                  <div className="h-2 w-2 rounded-full bg-slate-300" />
                  <span className="text-[11px] text-slate-400 font-medium">{f}</span>
                  <div className="ml-auto h-2 rounded-full bg-slate-200" style={{ width: '40%' }} />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
