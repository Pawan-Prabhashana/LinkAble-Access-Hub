import { STATUS_LABELS } from '@/constants/enums';

const styles: Record<string, string> = {
  NEW:         'bg-blue-100 text-blue-700 ring-blue-200',
  ASSIGNED:    'bg-purple-100 text-purple-700 ring-purple-200',
  IN_PROGRESS: 'bg-amber-100 text-amber-700 ring-amber-200',
  COMPLETED:   'bg-green-100 text-green-700 ring-green-200',
  CANCELLED:   'bg-slate-100 text-slate-500 ring-slate-200',
};

export default function StatusBadge({ status }: { status: string }) {
  const cls = styles[status] ?? 'bg-slate-100 text-slate-500 ring-slate-200';
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${cls}`}>
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}
