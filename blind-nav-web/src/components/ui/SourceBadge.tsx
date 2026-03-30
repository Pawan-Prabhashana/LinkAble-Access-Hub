import { SOURCE_LABELS } from '@/constants/enums';
import { Smartphone, UserCog, PhoneCall } from 'lucide-react';

const icons: Record<string, React.ReactNode> = {
  mobile_voice_report: <Smartphone className="h-3 w-3" />,
  mobile_app:          <Smartphone className="h-3 w-3" />,
  officer_manual_entry:<UserCog className="h-3 w-3" />,
  assisted_call:       <PhoneCall className="h-3 w-3" />,
};

export default function SourceBadge({ source }: { source: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600 ring-1 ring-inset ring-slate-200">
      {icons[source] ?? null}
      {SOURCE_LABELS[source] ?? source}
    </span>
  );
}
