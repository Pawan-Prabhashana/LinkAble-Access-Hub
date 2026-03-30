'use client';

import { useState } from 'react';
import { useRole, ROLES, OfficerRole } from '@/hooks/useRole';
import { ChevronDown, ChevronUp } from 'lucide-react';

export default function RoleSelector() {
  const { role, config, setRole } = useRole();
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-2 rounded-lg px-3 py-2.5 hover:bg-slate-800 transition-colors"
      >
        <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${config.bgColor} text-xs font-bold text-white`}>
          {config.avatar}
        </div>
        <div className="flex-1 text-left min-w-0">
          <p className="truncate text-xs font-semibold text-white leading-tight">{config.label}</p>
          <p className="truncate text-[10px] text-slate-400 leading-tight">Role active</p>
        </div>
        {open ? <ChevronUp className="h-3.5 w-3.5 text-slate-500" /> : <ChevronDown className="h-3.5 w-3.5 text-slate-500" />}
      </button>

      {open && (
        <div className="absolute bottom-full left-0 right-0 mb-1 rounded-xl bg-slate-800 shadow-2xl ring-1 ring-slate-700 overflow-hidden z-50">
          <p className="px-3 py-2 text-[10px] font-semibold uppercase tracking-widest text-slate-500 border-b border-slate-700">
            Switch Role
          </p>
          {ROLES.map((r) => (
            <button
              key={r.id}
              onClick={() => { setRole(r.id as OfficerRole); setOpen(false); }}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-left transition-colors hover:bg-slate-700 ${
                role === r.id ? 'bg-slate-700' : ''
              }`}
            >
              <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${r.bgColor} text-xs font-bold text-white`}>
                {r.avatar}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-white">{r.label}</p>
                <p className="text-[10px] text-slate-400 truncate">{r.description}</p>
              </div>
              {role === r.id && (
                <span className="ml-auto h-2 w-2 rounded-full bg-green-500 shrink-0" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
