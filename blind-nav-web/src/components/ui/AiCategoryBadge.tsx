import { AI_CATEGORY_LABELS, AI_CATEGORY_COLORS, AI_CATEGORY_ICONS } from '@/constants/enums';

interface Props {
  category: string;
  size?: 'sm' | 'md';
}

export default function AiCategoryBadge({ category, size = 'md' }: Props) {
  const label = AI_CATEGORY_LABELS[category] ?? category;
  const color = AI_CATEGORY_COLORS[category] ?? 'bg-violet-100 text-violet-700 ring-1 ring-violet-200';
  const icon  = AI_CATEGORY_ICONS[category]  ?? '🤖';

  const sizeClass = size === 'sm'
    ? 'px-2 py-0.5 text-[10px] gap-1'
    : 'px-2.5 py-1 text-xs gap-1.5';

  return (
    <span className={`inline-flex items-center rounded-full font-semibold ${color} ${sizeClass}`}>
      <span>{icon}</span>
      {label}
    </span>
  );
}
