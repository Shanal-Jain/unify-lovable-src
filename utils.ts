import { Initiative, SubIssue, HistoryEntry } from './types';

export const C = {
  green:  '#5DD4A8',
  yellow: '#F5C842',
  red:    '#E24B4A',
  purple: '#9B8FF8',
  blue:   '#7DB8ED',
  orange: '#F4A261',
  bg:     '#0A0A0F',
  surface:'#12121A',
  border: 'rgba(255,255,255,0.08)',
  text:   '#E8E8F0',
  muted:  'rgba(255,255,255,0.5)',
  faint:  'rgba(255,255,255,0.3)',
};

export const barColor = (v: number): string => v >= 70 ? C.green : v >= 40 ? C.yellow : C.red;

export const deliveredPct = (i: Initiative): number | null => {
  if (!i.totalSubIssues) return null;
  const den = i.subIssues.reduce((a, s) => a + s.cx * 100, 0);
  if (!den) return null;
  const num = i.subIssues.reduce((a, s) => a + s.cx * (s.eventScore || 0), 0);
  return Math.round(num / den * 100);
};

export const codeAvgFn = (i: Initiative): number => {
  const den = i.subIssues.reduce((a, s) => a + s.cx * 100, 0) || 1;
  return Math.round(i.subIssues.reduce((a, s) => a + s.cx * (s.score || 0), 0) / den * 100);
};

export const isCodeAhead = (i: Initiative): boolean => {
  const d = deliveredPct(i);
  return d !== null && codeAvgFn(i) > d;
};

export const codeAheadReason = (i: Initiative): string => {
  const gs = i.subIssues
    .filter(s => s.state !== 'CLOSED' && (s.score || 0) > (s.eventScore || 0))
    .sort((a, b) => b.cx - a.cx)[0];
  if (!gs) return 'code written ahead of pipeline';
  if (gs.stage === 'in-progress') return 'code written on branch, no PR open yet';
  if (gs.stage === 'pr-open') return 'code written, PR open awaiting review';
  if (gs.stage === 'polly-approved') return 'code written, awaiting human approval';
  if (gs.stage === 'human-approved') return 'code written, approved — awaiting merge';
  return 'code written ahead of pipeline';
};

export const inFlight = (i: Initiative): boolean =>
  i.status === 'Implementation' || i.status === 'Review';

export const subDelivered = (s: SubIssue): number =>
  Math.min(s.score || 0, s.eventScore || 0);

export const stageInfo = (s: SubIssue): { label: string; color: string; detail: string } => {
  const isManual = s.state !== 'CLOSED' && (s.workType === 'testing' || s.workType === 'decision');
  if (s.state === 'CLOSED' || s.stage === 'merged')
    return { label: 'Done', color: C.green, detail: 'Merged / closed' };
  if (isManual)
    return { label: 'Manual', color: C.muted, detail: 'Manual work — produces no code artifact' };
  const map: Record<string, { label: string; color: string; detail: string }> = {
    'no-pr':         { label: 'Not started', color: C.faint,  detail: 'No branch or PR yet' },
    'in-progress':   { label: 'In progress', color: C.yellow, detail: 'Branch open, no PR yet' },
    'pr-open':       { label: 'In review',   color: C.blue,   detail: 'PR open, awaiting review' },
    'polly-approved':{ label: 'In review',   color: C.purple, detail: 'Automated checks passed, awaiting human review' },
    'human-approved':{ label: 'In review',   color: C.purple, detail: 'Reviewed & approved, awaiting merge' },
  };
  return map[s.stage] ?? { label: s.stage, color: C.muted, detail: '' };
};

export const statusColors: Record<string, string> = {
  Proposal:       '#9aa0aa',
  Design:         C.blue,
  Plan:           C.yellow,
  Implementation: C.green,
  Review:         C.purple,
  Retrospective:  C.red,
};

export const blockerInclude = (s: SubIssue): boolean => {
  if (s.state === 'CLOSED') return false;
  if (s.workType === 'testing' || s.workType === 'decision') return false;
  const aged = (s.ageDays || 0) >= 3;
  if (['pr-open', 'polly-approved', 'human-approved'].includes(s.stage) && aged) return true;
  if (s.stage === 'in-progress' && aged) return true;
  return false;
};

const revNames = (s: SubIssue): string | null => {
  const a = s.humanApprovers?.length ? s.humanApprovers : [];
  const r = s.requestedReviewers?.length ? s.requestedReviewers : [];
  if (a.length) return a.map(x => '@' + x).join(', ');
  if (r.length) return r.map(x => '@' + x).join(', ');
  return null;
};

export const whyBlocked = (s: SubIssue): string => {
  const par = s.parentPR;
  if (par && !par.merged) {
    const state = par.state === 'open' ? 'still open' : (par.number ? 'closed unmerged' : 'no PR opened yet');
    const ref = par.number ? `PR #${par.number} (${par.branch}) — ${state}` : `branch ${par.branch} — ${state}`;
    return `Stacked on ${ref} — can't merge until the parent merges`;
  }
  if (s.mergeState === 'dirty') return 'Merge conflict — needs a rebase';
  if (s.failingCheck) return 'CI check failing: ' + s.failingCheck;
  const crb = s.changesRequestedBy?.length ? s.changesRequestedBy.join(', ') : null;
  const rv = revNames(s);
  if (s.stage === 'human-approved') return `Approved${rv ? ' by ' + rv : ''} — ready to merge`;
  if (s.stage === 'polly-approved') {
    if (crb) return `Changes requested by ${crb} — needs revision`;
    return rv ? `Waiting on ${rv} to review` : 'No reviewer assigned';
  }
  if (s.stage === 'pr-open') {
    if (crb) return `Actively being reviewed — changes requested by ${crb}`;
    return rv ? `Waiting on ${rv} to review` : 'PR open — no reviewer assigned yet';
  }
  if (s.stage === 'in-progress') return `No PR opened yet${s.engineer ? ' — being worked by @' + s.engineer : ''}`;
  return '';
};

export const waitingOn = (s: SubIssue): string => {
  const par = s.parentPR;
  if (par && !par.merged) {
    const state = par.state === 'open' ? 'still open' : (par.number ? 'closed unmerged' : 'no PR opened yet');
    return par.number ? `PR #${par.number} (${par.branch}) — ${state}` : `branch ${par.branch} — ${state}`;
  }
  if (s.mergeState === 'dirty') return 'Rebase';
  if (s.failingCheck) return s.failingCheck;
  const crb = s.changesRequestedBy?.length ? s.changesRequestedBy.join(', ') : null;
  const rv = revNames(s);
  if (s.stage === 'human-approved') return 'Merge';
  if (s.stage === 'polly-approved' || s.stage === 'pr-open') {
    if (crb) return crb;
    if (rv) return rv;
    return '—';
  }
  if (s.stage === 'in-progress') return s.engineer ? s.engineer : '—';
  return '—';
};

export const normalizeHistory = (h: HistoryEntry): HistoryEntry => {
  if (h.shipped != null || !h.initiatives) return h;
  const inits = h.initiatives;
  const shipped = inits.reduce((s, i) => s + (i.closedSubIssues || 0), 0);
  const inReview = inits.reduce((s, i) => s + (i.subIssuesWithPR || 0), 0);
  const notStarted = inits.reduce((s, i) => s + (i.subIssuesNoActivity || 0), 0);
  const totalOpen = inits.reduce((s, i) => s + (i.openSubIssues || 0), 0);
  const inProgress = Math.max(0, totalOpen - inReview - notStarted);
  return { ...h, shipped, inReview, inProgress, notStarted, blocked: 0 };
};

// Converts any date string (ISO or PowerShell MM/DD/YYYY HH:MM:SS) to YYYY-MM-DD
const toYMD = (s: string): string => {
  if (!s) return '';
  const mm = /^(\d{1,2})\/(\d{1,2})\/(\d{4})/.exec(s);
  if (mm) return `${mm[3]}-${mm[1].padStart(2, '0')}-${mm[2].padStart(2, '0')}`;
  return s.slice(0, 10);
};

export const weekMonday = (dateStr: string): string => {
  const ymd = toYMD(dateStr);
  if (!ymd) return '';
  const d = new Date(ymd + 'T00:00:00Z');
  const day = d.getUTCDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setUTCDate(d.getUTCDate() + diff);
  return d.toISOString().slice(0, 10);
};

export const fmtShortDate = (dateStr: string): string => {
  const ymd = toYMD(dateStr);
  if (!ymd) return '';
  return new Date(ymd + 'T00:00:00Z').toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
};

export const daysSince = (dateStr: string): number => {
  const ymd = toYMD(dateStr);
  if (!ymd) return 0;
  return Math.round((Date.now() - new Date(ymd + 'T00:00:00Z').getTime()) / 86400000);
};
