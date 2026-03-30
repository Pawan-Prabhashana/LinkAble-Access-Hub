'use client';

import { useState, useEffect, useCallback } from 'react';

export type OfficerRole =
  | 'ACCESSIBILITY_OFFICER'
  | 'FACILITIES_OFFICER'
  | 'SECURITY_OFFICER'
  | 'STUDENT_SUPPORT'
  | 'OPERATIONS_MANAGER';

export interface RoleConfig {
  id: OfficerRole;
  label: string;
  shortLabel: string;
  avatar: string;
  color: string;
  bgColor: string;
  categories: string[] | null; // null = see all
  description: string;
}

export const ROLES: RoleConfig[] = [
  {
    id: 'ACCESSIBILITY_OFFICER',
    label: 'Accessibility Officer',
    shortLabel: 'AO',
    avatar: 'AO',
    color: 'text-blue-700',
    bgColor: 'bg-blue-600',
    categories: null,
    description: 'Full access — all accessibility requests',
  },
  {
    id: 'FACILITIES_OFFICER',
    label: 'Facilities Officer',
    shortLabel: 'FO',
    avatar: 'FO',
    color: 'text-amber-700',
    bgColor: 'bg-amber-500',
    categories: ['PHYSICAL_OBSTRUCTION','ACCESSIBILITY_EQUIPMENT_ISSUE','FACILITY_ACCESS_ISSUE'],
    description: 'Physical access, equipment, and facility issues',
  },
  {
    id: 'SECURITY_OFFICER',
    label: 'Security Officer',
    shortLabel: 'SO',
    avatar: 'SO',
    color: 'text-red-700',
    bgColor: 'bg-red-600',
    categories: ['UNSAFE_ENVIRONMENT','EMERGENCY_SUPPORT'],
    description: 'Safety hazards and emergency response',
  },
  {
    id: 'STUDENT_SUPPORT',
    label: 'Student Support Officer',
    shortLabel: 'SS',
    avatar: 'SS',
    color: 'text-emerald-700',
    bgColor: 'bg-emerald-600',
    categories: ['NAVIGATION_ASSISTANCE'],
    description: 'Navigation assistance and student welfare',
  },
  {
    id: 'OPERATIONS_MANAGER',
    label: 'Operations Manager',
    shortLabel: 'OM',
    avatar: 'OM',
    color: 'text-violet-700',
    bgColor: 'bg-violet-600',
    categories: null,
    description: 'All requests · SLA oversight · Escalations',
  },
];

const STORAGE_KEY = 'linkable_role';
const DEFAULT_ROLE: OfficerRole = 'ACCESSIBILITY_OFFICER';

export function useRole() {
  const [role, setRoleState] = useState<OfficerRole>(DEFAULT_ROLE);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as OfficerRole | null;
    if (stored && ROLES.find(r => r.id === stored)) {
      setRoleState(stored);
    }
  }, []);

  const setRole = useCallback((r: OfficerRole) => {
    setRoleState(r);
    localStorage.setItem(STORAGE_KEY, r);
  }, []);

  const config = ROLES.find(r => r.id === role) ?? ROLES[0];

  return { role, config, setRole, allRoles: ROLES };
}
