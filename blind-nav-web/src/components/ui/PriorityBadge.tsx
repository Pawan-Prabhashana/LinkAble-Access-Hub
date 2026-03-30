import { PRIORITY_LABELS } from '@/constants/enums';

const styles: Record<string, string> = {
  CRITICAL:       'bg-red-100 text-red-700 ring-red-200',
  HIGH:           'bg-orange-100 text-orange-700 ring-orange-200',
  MEDIUM:         'bg-yellow-100 text-yellow-700 ring-yellow-200',
  LOW:            'bg-green-100 text-green-700 ring-green-200',
  PENDING_REVIEW: 'bg-slate-100 text-slate-500 ring-slate-200',
};

const dots: Record<string, string> = {
  CRITICAL: 'bg-red-500',
  HIGH:     'bg-orange-500',
  MEDIUM:   'bg-yellow-500',
  LOW:      'bg-green-500',
};

export default function PriorityBadge({ priority }: { priority: string }) {
  const cls = styles[priority] ?? 'bg-slate-100 text-slate-500 ring-slate-200';
  const dot = dots[priority];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${cls}`}>
      {dot && <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />}
      {PRIORITY_LABELS[priority] ?? priority}
    </span>
  );
}
