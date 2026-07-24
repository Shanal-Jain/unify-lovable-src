export interface SubIssue {
  number: number;
  title: string;
  state: 'OPEN' | 'CLOSED';
  score: number;
  eventScore: number;
  delivScore: number;
  stage: 'no-pr' | 'in-progress' | 'pr-open' | 'polly-approved' | 'human-approved' | 'merged' | 'manual';
  reviewStage: string;
  reason: string;
  deliveredReason: string;
  size: 'S' | 'M' | 'L';
  cx: number;
  workType: 'code' | 'testing' | 'decision' | string;
  risk: 'low' | 'medium' | 'high';
  hasMergedPR: boolean;
  pr: string | null;
  engineer: string;
  branch: string;
  parentPR: { number?: number; branch: string; state: string; merged: boolean } | null;
  ageDays: number;
  mergeState: string;
  failingCheck: string | null;
  pollyBlocked: boolean;
  humanApprovers: string[];
  requestedReviewers: string[];
  subTaskTotal: number;
  subTaskClosed: number;
  createdAt: string;
  closedAt: string | null;
}

export interface Initiative {
  number: number;
  title: string;
  status: 'Proposal' | 'Design' | 'Plan' | 'Implementation' | 'Review' | 'Retrospective' | 'Triage' | 'Unknown';
  team: 'Beaky Blinders' | 'Raven' | 'Both';
  assignee: string;
  score: number;
  totalSubIssues: number;
  closedSubIssues: number;
  shippedSubIssues: number;
  openSubIssues: number;
  subIssuesWithPR: number;
  subIssuesNoActivity: number;
  planChanged: boolean;
  subIssuesAdded: number;
  createdAt: string;
  designSince: string | null;
  planSince: string | null;
  implSince: string | null;
  retroSince: string | null;
  subIssues: SubIssue[];
}

export interface ShippedItem {
  number: number;
  title: string;
  initiative: string;
  team: string;
  engineer: string;
  pr: number | null;
  closedAt: string;
  size: string;
}

export interface BugItem {
  number: number;
  title: string;
  assignee: string;
  status: string;
  team: string;
  createdAt: string;
  updatedAt: string;
  prStatus: 'no-pr' | 'pr-open' | 'pr-merged';
  prNumber: number | null;
  prUrl: string | null;
}

export interface SupportItem {
  number: number;
  title: string;
  assignee: string;
  status: string;
  team: string;
  createdAt: string;
  updatedAt: string;
  prStatus: 'no-pr' | 'pr-open' | 'pr-merged';
  prNumber: number | null;
  prUrl: string | null;
}

export interface HistoryEntry {
  date: string;
  source?: string;
  shipped: number;
  inReview: number;
  inProgress: number;
  notStarted: number;
  blocked?: number;
  shippedPoints?: number;
  demo?: boolean;
  initiatives?: Initiative[];
  perTeam?: {
    Ironclad?: { shipped: number; inReview: number; inProgress: number; notStarted: number };
    Raven?: { shipped: number; inReview: number; inProgress: number; notStarted: number };
  };
}

export interface StatusTransition {
  number: number;
  title: string;
  team: string;
  from: string | null;
  to: string;
  date: string;
  seeded: boolean;
}

export interface StatusLog {
  lastSeen: Record<string, string>;
  transitions: StatusTransition[];
}

export interface CycleDataItem {
  number: number;
  name: string;
  board: string;
  status: string;
  subCount: number;
  avgSubDays: number;
  maxSubDays: number;
  leadDays: number | null;
  activeDays: number | null;
  planDays: number | null;
  designDays: number | null;
}

export interface DashboardSnapshot {
  snapshot_date: string;
  initiatives: Initiative[];
  cycle_data: CycleDataItem[];
  bugs: BugItem[];
  support: SupportItem[];
  shipped: ShippedItem[];
  history: HistoryEntry[];
  status_log: StatusLog;
}

export type TeamFilter = 'all' | 'Beaky Blinders' | 'Raven';
export type TabId = 'overview' | 'trends' | 'bugs' | 'support';
