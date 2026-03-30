'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, ClipboardList, PlusCircle,
  Settings, Accessibility, ChevronRight, Bell,
} from 'lucide-react';
import { useAlerts } from '@/hooks/useAlerts';

export default function Sidebar() {
  const pathname = usePathname();
  const { unreadCount } = useAlerts();

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href);

  const navItems = [
    { label: 'Dashboard',    href: '/',             icon: LayoutDashboard },
    { label: 'All Requests', href: '/requests',      icon: ClipboardList   },
    { label: 'New Request',  href: '/requests/new',  icon: PlusCircle      },
    { label: 'Alerts',       href: '/alerts',        icon: Bell, badge: unreadCount > 0 ? unreadCount : undefined },
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
          <p className="text-[10px] leading-tight text-slate-400">Request Platform</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4 scrollbar-thin">
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
                {active && !badge && <ChevronRight className="h-3.5 w-3.5 text-slate-500" />}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-slate-800 px-4 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-700 text-xs font-bold text-white">
            AO
          </div>
          <div className="flex-1 truncate">
            <p className="truncate text-xs font-semibold text-white">Access Officer</p>
            <p className="truncate text-[10px] text-slate-400">Phase 4 · Hackathon</p>
          </div>
          <Settings className="h-4 w-4 cursor-pointer text-slate-500 hover:text-slate-300" />
        </div>
      </div>
    </aside>
  );
}
