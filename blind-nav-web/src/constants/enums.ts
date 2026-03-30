export const REQUEST_STATUS = {
  NEW: 'NEW',
  ASSIGNED: 'ASSIGNED',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
} as const;

// Valid transitions: key -> allowed next statuses
export const STATUS_TRANSITIONS: Record<string, string[]> = {
  NEW: ['ASSIGNED', 'CANCELLED'],
  ASSIGNED: ['IN_PROGRESS', 'CANCELLED'],
  IN_PROGRESS: ['COMPLETED', 'CANCELLED'],
  COMPLETED: [],
  CANCELLED: [],
};

export const REQUEST_PRIORITY = {
  CRITICAL: 'CRITICAL',
  HIGH: 'HIGH',
  MEDIUM: 'MEDIUM',
  LOW: 'LOW',
  PENDING_REVIEW: 'PENDING_REVIEW',
} as const;

// ── User-entered categories (manual intake form) ───────────────────────────────

export const REQUEST_CATEGORY = {
  ACCESSIBILITY_SUPPORT: 'ACCESSIBILITY_SUPPORT',
  PATHWAY_BLOCKED: 'PATHWAY_BLOCKED',
  ENTRANCE_BLOCKED: 'ENTRANCE_BLOCKED',
  LIFT_ISSUE: 'LIFT_ISSUE',
  NAVIGATION_AID: 'NAVIGATION_AID',
  SAFETY_CONCERN: 'SAFETY_CONCERN',
  OTHER: 'OTHER',
} as const;

export const CATEGORY_LABELS: Record<string, string> = {
  ACCESSIBILITY_SUPPORT: 'Accessibility Support',
  PATHWAY_BLOCKED: 'Pathway Blocked',
  ENTRANCE_BLOCKED: 'Entrance Blocked',
  LIFT_ISSUE: 'Lift Issue',
  NAVIGATION_AID: 'Navigation Aid',
  SAFETY_CONCERN: 'Safety Concern',
  OTHER: 'Other',
};

// ── AI-predicted categories (Phase 2 taxonomy) ────────────────────────────────

export const AI_CATEGORY = {
  PHYSICAL_OBSTRUCTION:         'PHYSICAL_OBSTRUCTION',
  ACCESSIBILITY_EQUIPMENT_ISSUE: 'ACCESSIBILITY_EQUIPMENT_ISSUE',
  NAVIGATION_ASSISTANCE:        'NAVIGATION_ASSISTANCE',
  UNSAFE_ENVIRONMENT:           'UNSAFE_ENVIRONMENT',
  FACILITY_ACCESS_ISSUE:        'FACILITY_ACCESS_ISSUE',
  EMERGENCY_SUPPORT:            'EMERGENCY_SUPPORT',
} as const;

export const AI_CATEGORY_LABELS: Record<string, string> = {
  PHYSICAL_OBSTRUCTION:         'Physical Obstruction',
  ACCESSIBILITY_EQUIPMENT_ISSUE: 'Equipment Issue',
  NAVIGATION_ASSISTANCE:        'Navigation Assistance',
  UNSAFE_ENVIRONMENT:           'Unsafe Environment',
  FACILITY_ACCESS_ISSUE:        'Facility Access',
  EMERGENCY_SUPPORT:            'Emergency Support',
};

export const AI_CATEGORY_COLORS: Record<string, string> = {
  PHYSICAL_OBSTRUCTION:         'bg-orange-100 text-orange-700 ring-1 ring-orange-200',
  ACCESSIBILITY_EQUIPMENT_ISSUE: 'bg-blue-100 text-blue-700 ring-1 ring-blue-200',
  NAVIGATION_ASSISTANCE:        'bg-cyan-100 text-cyan-700 ring-1 ring-cyan-200',
  UNSAFE_ENVIRONMENT:           'bg-red-100 text-red-700 ring-1 ring-red-200',
  FACILITY_ACCESS_ISSUE:        'bg-amber-100 text-amber-700 ring-1 ring-amber-200',
  EMERGENCY_SUPPORT:            'bg-rose-100 text-rose-700 ring-1 ring-rose-200',
};

export const AI_CATEGORY_ICONS: Record<string, string> = {
  PHYSICAL_OBSTRUCTION:         '🚧',
  ACCESSIBILITY_EQUIPMENT_ISSUE: '🛗',
  NAVIGATION_ASSISTANCE:        '🧭',
  UNSAFE_ENVIRONMENT:           '⚠️',
  FACILITY_ACCESS_ISSUE:        '🚪',
  EMERGENCY_SUPPORT:            '🆘',
};

// ── Sources ───────────────────────────────────────────────────────────────────

export const REQUEST_SOURCE = {
  MOBILE_VOICE: 'mobile_voice_report',
  MANUAL: 'officer_manual_entry',
  CALL: 'assisted_call',
  MOBILE_APP: 'mobile_app',
} as const;

export const SOURCE_LABELS: Record<string, string> = {
  mobile_voice_report: 'Mobile Voice',
  officer_manual_entry: 'Manual Entry',
  assisted_call: 'Assisted Call',
  mobile_app: 'Mobile App',
};

// ── Labels ────────────────────────────────────────────────────────────────────

export const PRIORITY_LABELS: Record<string, string> = {
  CRITICAL: 'Critical',
  HIGH: 'High',
  MEDIUM: 'Medium',
  LOW: 'Low',
  PENDING_REVIEW: 'Pending Review',
};

export const STATUS_LABELS: Record<string, string> = {
  NEW: 'New',
  ASSIGNED: 'Assigned',
  IN_PROGRESS: 'In Progress',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
};
