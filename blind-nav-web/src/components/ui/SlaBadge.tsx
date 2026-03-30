import { Clock, AlertTriangle, CheckCircle2, Flame } from 'lucide-react';
import { SLA_STATUS_LABELS, SLA_STATUS_COLORS } from '@/constants/enums';

interface Props {
  slaStatus?: string | null;
  slaMinutesRemaining?: number | null;
  size?: 'sm' | 'md';
}

function formatTime(minutes: number): string {
  if (minutes < 0) {
    const abs = Math.abs(minutes);
    if (abs < 60) return `${Math.round(abs)}m overdue`;
    return `${Math.round(abs / 60)}h overdue`;
  }
  if (minutes < 60) return `${Math.round(minutes)}m left`;
  if (minutes < 1440) return `${Math.round(minutes / 60)}h left`;
  return `${Math.round(minutes / 1440)}d left`;
}

export default function SlaBadge({ slaStatus, slaMinutesRemaining, size = 'md' }: Props) {
  if (!slaStatus || slaStatus === 'COMPLETED') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-400">
        <CheckCircle2 className="h-3 w-3" /> Done
      </span>
    );
  }

  const color = SLA_STATUS_COLORS[slaStatus] ?? 'bg-slate-100 text-slate-500';
  const label = SLA_STATUS_LABELS[slaStatus] ?? slaStatus;

  const Icon =
    slaStatus === 'BREACHED'  ? Flame :
    slaStatus === 'AT_RISK'   ? AlertTriangle :
    Clock;

  const sizeClass = size === 'sm' ? 'px-2 py-0.5 text-[10px] gap-1' : 'px-2.5 py-1 text-xs gap-1.5';

  return (
    <div className="flex flex-col items-start gap-0.5">
      <span className={`inline-flex items-center rounded-full font-semibold ${color} ${sizeClass}`}>
        <Icon className="h-3 w-3 shrink-0" />
        {label}
      </span>
      {slaMinutesRemaining != null && slaStatus !== 'COMPLETED' && (
        <span className={`text-[10px] font-medium ${
          slaStatus === 'BREACHED' ? 'text-red-500'
          : slaStatus === 'AT_RISK' ? 'text-amber-600'
          : 'text-slate-400'
        }`}>
          {formatTime(slaMinutesRemaining)}
        </span>
      )}
    </div>
  );
}
