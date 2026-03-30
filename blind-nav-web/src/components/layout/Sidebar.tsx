'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, ClipboardList, PlusCircle,
  Bell, Map, Send, Accessibility, MessageSquare,
  ChevronRight,
} from 'lucide-react';
import { useAlerts } from '@/hooks/useAlerts';
import RoleSelector from './RoleSelector';

export default function Sidebar() {
  const pathname = usePathname();
  const { unreadCount } = useAlerts();

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href);

  const navItems = [
    { label: 'Dashboard',       href: '/',                  icon: LayoutDashboard },
    { label: 'All Requests',    href: '/requests',           icon: ClipboardList   },
    { label: 'New Request',     href: '/requests/new',       icon: PlusCircle      },
    { label: 'AI Chat Intake',  href: '/chat',               icon: MessageSquare   },
    { label: 'Map View',        href: '/map',                icon: Map             },
    { label: 'Alerts',          href: '/alerts',             icon: Bell, badge: unreadCount > 0 ? unreadCount : undefined },
    { label: 'Notifications',   href: '/notifications',      icon: Send            },
  ];

  return (
    <aside className="fixed inset-y-0 left-0 z-40 flex w-60 flex-col bg-slate-900">
      {/* Brand */}
      <div className="flex h-16 items-center gap-3 border-b border-slate-800 px-5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600">
          <Accessibility className="h-5 w-5 text-white" />
        </div>
        <div>
          <p className="text-sm font-bold leading-tight text-white">AccessHub</p>
          <p className="text-[10px] leading-tight text-slate-400">LinkAble · Phase 6</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-4 scrollbar-thin">
        <p className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-widest text-slate-500">
          Operations
        </p>
        {navItems.map(({ label, href, icon: Icon, badge }) => {
          const active = isActive(href);
          return (
            <Link
              key={href}
              href={href}
              className={`group flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                active
                  ? 'bg-slate-800 text-white'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <span className="flex items-center gap-3">
                <Icon className={`h-4 w-4 ${active ? 'text-blue-400' : 'text-slate-500 group-hover:text-slate-300'}`} />
                {label}
              </span>
              <span className="flex items-center gap-1.5">
                {badge != null && (
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                    {badge > 9 ? '9+' : badge}
                  </span>
                )}
                {active && badge == null && <ChevronRight className="h-3.5 w-3.5 text-slate-500" />}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* Role selector */}
      <div className="border-t border-slate-800 px-3 py-3">
        <p className="mb-1.5 px-2 text-[10px] font-semibold uppercase tracking-widest text-slate-500">
          Active Role
        </p>
        <RoleSelector />
      </div>
    </aside>
  );
}
