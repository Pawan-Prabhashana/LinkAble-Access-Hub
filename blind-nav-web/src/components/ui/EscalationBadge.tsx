import { ShieldAlert } from 'lucide-react';
import { ESCALATION_LABELS, ESCALATION_COLORS } from '@/constants/enums';

interface Props {
  level?: string | null;
  size?: 'sm' | 'md';
}

export default function EscalationBadge({ level, size = 'md' }: Props) {
  if (!level || level === 'NONE') return null;

  const color = ESCALATION_COLORS[level] ?? 'bg-slate-100 text-slate-600 ring-1 ring-slate-200';
  const label = ESCALATION_LABELS[level] ?? level.replace(/_/g, ' ');
  const sizeClass = size === 'sm' ? 'px-2 py-0.5 text-[10px] gap-1' : 'px-2.5 py-1 text-xs gap-1.5';

  return (
    <span className={`inline-flex items-center rounded-full font-semibold ${color} ${sizeClass}`}>
      <ShieldAlert className="h-3 w-3 shrink-0" />
      {label}
    </span>
  );
}
