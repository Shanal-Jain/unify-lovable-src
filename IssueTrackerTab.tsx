import React, { useState, useMemo } from 'react';
import { BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Initiative, ShippedItem, StatusLog } from '../types';
import {
  C, barColor, deliveredPct, codeAvgFn, isCodeAhead, codeAheadReason,
  inFlight, subDelivered, stageInfo, fmtShortDate, daysSince, statusColors,
} from '../utils';

const GH = 'https://github.com/boostlingo/bl-platform';

// ── Issues by Stage chart ────────────────────────────────────────────────

const STATUS_ORDER = ['Proposal', 'Design', 'Plan', 'Implementation', 'Review', 'Retrospective'];

function IssuesByStageChart({ initiatives }: { initiatives: Initiative[] }) {
  const data = useMemo(() => {
    const counts: Record<string, number> = {};
    STATUS_ORDER.forEach(s => (counts[s] = 0));
    initiatives.forEach(i => { counts[i.status] = (counts[i.status] || 0) + 1; });
    return STATUS_ORDER.filter(s => counts[s] > 0).map(s => ({ status: s, count: counts[s], fill: statusColors[s] || C.muted }));
  }, [initiatives]);

  if (!data.length) return null;

  return (
    <div style={{ marginBottom: 28 }}>
      <div style={{ fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 4 }}>Issues by stage</div>
      <div style={{ fontSize: 12, color: C.muted, marginBottom: 12 }}>Count of issues at each stage of the process.</div>
      <div style={{ height: 160 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} barGap={4}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
            <XAxis dataKey="status" tick={{ fill: C.muted, fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: C.muted, fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
            <Tooltip
              contentStyle={{ background: '#1A1A28', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, fontSize: 12 }}
              labelStyle={{ color: C.text, fontWeight: 600 }}
              cursor={{ fill: 'rgba(255,255,255,0.04)' }}
            />
            <Bar dataKey="count" radius={[4, 4, 0, 0]}>
              {data.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// ── helpers ─────────────────────────────────────────────────────────────────

function TeamBadge({ team }: { team: string }) {
  const style: React.CSSProperties =
    team === 'Beaky Blinders'
      ? { background: 'rgba(155,143,248,0.2)', color: '#9B8FF8', border: '1px solid rgba(155,143,248,0.4)' }
      : team === 'Raven'
      ? { background: 'rgba(93,212,168,0.15)', color: '#5DD4A8', border: '1px solid rgba(93,212,168,0.35)' }
      : { background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.15)' };
  return (
    <span style={{ ...style, fontSize: 10, fontWeight: 600, padding: '2px 7px', borderRadius: 20 }}>
      {team}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, { bg: string; color: string }> = {
    Implementation: { bg: 'rgba(93,212,168,0.15)',  color: '#5DD4A8' },
    Review:         { bg: 'rgba(155,143,248,0.15)', color: '#9B8FF8' },
    Plan:           { bg: 'rgba(245,200,66,0.15)',  color: '#F5C842' },
    Design:         { bg: 'rgba(125,184,237,0.15)', color: '#7DB8ED' },
    Proposal:       { bg: 'rgba(154,160,170,0.15)', color: '#9aa0aa' },
    Retrospective:  { bg: 'rgba(226,75,74,0.15)',   color: '#E24B4A' },
  };
  const c = colors[status] ?? { bg: 'rgba(255,255,255,0.07)', color: C.muted };
  return (
    <span style={{ ...c, fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 10 }}>
      {status}
    </span>
  );
}

function StageBadge({ s }: { s: import('../types').SubIssue }) {
  const info = stageInfo(s);
  return (
    <span
      title={info.detail}
      style={{
        fontSize: 10, fontWeight: 600, padding: '2px 7px', borderRadius: 10, cursor: 'help',
        background: info.color + '22', color: info.color, border: `1px solid ${info.color}44`,
      }}
    >
      {info.label}
    </span>
  );
}

function ProgBar({ pct, tooltip }: { pct: number; tooltip: string }) {
  const col = barColor(pct);
  return (
    <div title={tooltip} style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'help' }}>
      <div style={{ width: 80, height: 5, background: 'rgba(255,255,255,0.1)', borderRadius: 3, overflow: 'hidden', flexShrink: 0 }}>
        <div style={{ width: `${pct}%`, height: '100%', background: col, borderRadius: 3 }} />
      </div>
      <span style={{ color: col, fontSize: 12, fontWeight: 600, borderBottom: `1px dotted rgba(255,255,255,0.3)` }}>
        {pct}%
      </span>
    </div>
  );
}

// ── detail card (sub-issue table) ─────────────────────────────────────────

function DetailCard({ i }: { i: Initiative }) {
  const d = deliveredPct(i);
  const col = barColor(d ?? 0);
  return (
    <tr>
      <td colSpan={6} style={{ padding: '0 0 0 48px', background: 'rgba(255,255,255,0.02)' }}>
        <div style={{ padding: '14px 20px 14px 0' }}>
          {/* summary bar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
            <span style={{ color: C.muted, fontSize: 12 }}>{i.closedSubIssues}/{i.totalSubIssues} done</span>
            <div style={{ flex: 1, height: 6, background: 'rgba(255,255,255,0.08)', borderRadius: 3, overflow: 'hidden', maxWidth: 200 }}>
              <div style={{ width: `${d ?? 0}%`, height: '100%', background: col, borderRadius: 3 }} />
            </div>
            <span style={{ color: col, fontSize: 13, fontWeight: 700 }}>{d ?? 0}%</span>
          </div>
          {/* sub-issue table */}
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ color: C.muted, fontSize: 10, fontWeight: 600, textTransform: 'uppercase' }}>
                <th style={{ textAlign: 'left', padding: '4px 8px', width: 50 }}>#</th>
                <th style={{ textAlign: 'left', padding: '4px 8px' }}>Task</th>
                <th style={{ textAlign: 'center', padding: '4px 8px', width: 50 }}>Size</th>
                <th style={{ textAlign: 'center', padding: '4px 8px', width: 80 }}>Delivered</th>
                <th style={{ textAlign: 'left', padding: '4px 8px', width: 100 }}>Status</th>
                <th style={{ textAlign: 'left', padding: '4px 8px' }}>Notes</th>
              </tr>
            </thead>
            <tbody>
              {i.subIssues.map(s => {
                const isManual = s.state !== 'CLOSED' && (s.workType === 'testing' || s.workType === 'decision');
                const dv = isManual ? 0 : subDelivered(s);
                const dvCol = barColor(dv);
                const gap = (s.score || 0) > dv && s.deliveredReason;
                const noteText = gap ? s.deliveredReason : (s.reason || '');
                const note = noteText ? (noteText.length > 70 ? noteText.slice(0, 68) + '…' : noteText) : '—';
                const sizes: Record<string, string> = { 1: 'S', 3: 'M', 5: 'L' };
                const szLabel = sizes[String(s.cx)] ?? 'S';
                const szColor = szLabel === 'L' ? C.red : szLabel === 'M' ? C.yellow : C.green;
                return (
                  <tr key={s.number} style={{ opacity: s.state === 'CLOSED' ? 0.5 : 1, borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                    <td style={{ padding: '5px 8px' }}>
                      <a href={`${GH}/issues/${s.number}`} target="_blank" rel="noreferrer"
                         style={{ color: C.muted, textDecoration: 'none' }}>#{s.number}</a>
                    </td>
                    <td style={{ padding: '5px 8px', color: C.text, maxWidth: 260 }}>
                      {s.title}
                      {s.risk === 'high' && <span style={{ marginLeft: 6, fontSize: 10, color: C.red, fontWeight: 600 }}>⚠ High risk</span>}
                      {s.risk === 'medium' && <span style={{ marginLeft: 6, fontSize: 10, color: C.yellow, fontWeight: 600 }}>Med risk</span>}
                      {s.workType && s.workType !== 'code' && (
                        <span style={{ marginLeft: 6, fontSize: 10, color: C.muted, background: 'rgba(255,255,255,0.07)', padding: '1px 5px', borderRadius: 6 }}>{s.workType}</span>
                      )}
                    </td>
                    <td style={{ padding: '5px 8px', textAlign: 'center' }}>
                      <span style={{ fontSize: 10, fontWeight: 700, color: szColor, background: szColor + '22', padding: '1px 6px', borderRadius: 8 }}>{szLabel}</span>
                    </td>
                    <td style={{ padding: '5px 8px', textAlign: 'center', color: dvCol, fontWeight: 600 }}>
                      <span title={gap ? s.deliveredReason : undefined}
                            style={{ borderBottom: gap ? '1px dotted rgba(255,255,255,0.3)' : undefined, cursor: gap ? 'help' : undefined }}>
                        {dv}%
                      </span>
                    </td>
                    <td style={{ padding: '5px 8px' }}>
                      <StageBadge s={s} />
                    </td>
                    <td style={{ padding: '5px 8px', color: C.muted }}>
                      <span title={noteText} style={{ cursor: noteText ? 'help' : undefined, borderBottom: noteText ? '1px dotted rgba(255,255,255,0.2)' : undefined }}>
                        {note}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </td>
    </tr>
  );
}

// ── shipped table ────────────────────────────────────────────────────────

function ShippedTable({ shipped }: { shipped: ShippedItem[] }) {
  const cutoff = Date.now() - 7 * 86400000;
  const recent = shipped.filter(s => s.closedAt && new Date(s.closedAt).getTime() >= cutoff);
  if (!recent.length) return (
    <div style={{ color: C.faint, fontSize: 13, padding: '12px 0' }}>Nothing merged in the last 7 days.</div>
  );
  return (
    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
      <thead>
        <tr style={{ color: C.muted, fontSize: 10, fontWeight: 600, textTransform: 'uppercase' }}>
          <th style={{ textAlign: 'left', padding: '6px 8px' }}>#</th>
          <th style={{ textAlign: 'left', padding: '6px 8px' }}>Sub-issue</th>
          <th style={{ textAlign: 'left', padding: '6px 8px' }}>Issue</th>
          <th style={{ textAlign: 'left', padding: '6px 8px' }}>Engineer</th>
          <th style={{ textAlign: 'left', padding: '6px 8px' }}>PR</th>
        </tr>
      </thead>
      <tbody>
        {recent.map(s => (
          <tr key={s.number} style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
            <td style={{ padding: '6px 8px' }}>
              <a href={`${GH}/issues/${s.number}`} target="_blank" rel="noreferrer" style={{ color: C.muted }}>#{s.number}</a>
            </td>
            <td style={{ padding: '6px 8px', color: C.text }}>{s.title}</td>
            <td style={{ padding: '6px 8px', color: C.muted, fontSize: 11 }}>{s.initiative}</td>
            <td style={{ padding: '6px 8px', color: C.muted }}>
              {s.engineer ? <span style={{ color: C.text }}>@{s.engineer}</span> : <span style={{ color: C.faint }}>—</span>}
            </td>
            <td style={{ padding: '6px 8px' }}>
              {s.pr
                ? <a href={`${GH}/pull/${s.pr}`} target="_blank" rel="noreferrer" style={{ color: C.green, fontSize: 11 }}>#{s.pr} <span style={{ color: C.green, fontSize: 10, marginLeft: 4 }}>Merged</span></a>
                : <span style={{ color: C.green, fontSize: 11 }}>Closed</span>}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

// ── main tracker table ────────────────────────────────────────────────────

export function IssueTrackerTab({
  initiatives,
  shipped,
  statusLog,
}: {
  initiatives: Initiative[];
  shipped: ShippedItem[];
  statusLog: StatusLog;
}) {
  const [expanded, setExpanded] = useState<Set<number>>(new Set());
  const [showShipped, setShowShipped] = useState(false);

  const inDelivery = initiatives.filter(inFlight);

  const toggle = (n: number) =>
    setExpanded(prev => { const s = new Set(prev); s.has(n) ? s.delete(n) : s.add(n); return s; });

  const fmtImplDate = (i: Initiative): React.ReactNode => {
    if (i.status !== 'Implementation' && i.status !== 'Review') return <span style={{ color: C.faint }}>—</span>;
    const iso = i.implSince ?? (() => {
      const t = statusLog?.transitions?.filter(t => t.number === i.number && t.to === 'Implementation').sort((a, b) => a.date.localeCompare(b.date));
      return t?.length ? t[0].date : null;
    })();
    if (!iso) return <span style={{ color: C.faint }} title="Date not recorded">—</span>;
    const days = Math.round((Date.now() - new Date(iso).getTime()) / 86400000);
    return <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12 }} title={`${days} days in implementation`}>{fmtShortDate(iso)}</span>;
  };

  return (
    <div>
      {/* Issue overview section */}
      <div style={{ marginBottom: 6 }}>
        <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: C.text, marginBottom: 4 }}>Issue Overview</div>
        <div style={{ fontSize: 12, color: C.muted, marginBottom: 16 }}>Where issues sit today, and how much work is still left on each.</div>
      </div>
      <IssuesByStageChart initiatives={initiatives} />

      {/* In-delivery table */}
      <div style={{ marginBottom: 4, fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: C.text }}>
        Issue Tracker
      </div>
      <div style={{ marginBottom: 8, fontSize: 12, color: C.muted }}>
        In-flight issues (Implementation &amp; Review). The bar is % delivered; hover it for the reason it isn't higher.
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ color: C.muted, fontSize: 10, fontWeight: 600, textTransform: 'uppercase', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
              <th style={{ textAlign: 'left', padding: '8px 12px' }}>Issue</th>
              <th style={{ textAlign: 'left', padding: '8px 12px', width: 120 }}>Team</th>
              <th style={{ textAlign: 'left', padding: '8px 12px', width: 110 }}>Status</th>
              <th style={{ textAlign: 'left', padding: '8px 12px', width: 160 }}>% Delivered</th>
              <th style={{ textAlign: 'left', padding: '8px 12px', width: 90 }}>Since</th>
              <th style={{ textAlign: 'left', padding: '8px 12px', width: 120 }}>Assignee</th>
            </tr>
          </thead>
          <tbody>
            {!inDelivery.length ? (
              <tr><td colSpan={6} style={{ padding: '16px 12px', color: C.faint }}>No issues in Implementation or Review.</td></tr>
            ) : inDelivery.map(i => {
              const d = deliveredPct(i);
              const ca = isCodeAhead(i);
              const codeAvg = codeAvgFn(i);
              const tooltip = ca
                ? `Code: ${codeAvg}% — ${codeAheadReason(i)}`
                : `Code: ${codeAvg}%`;
              const isExpanded = expanded.has(i.number);
              const unassigned = i.assignee === 'Unassigned';
              return (
                <React.Fragment key={i.number}>
                  <tr
                    onClick={() => toggle(i.number)}
                    style={{ borderTop: '1px solid rgba(255,255,255,0.05)', cursor: 'pointer' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.025)')}
                    onMouseLeave={e => (e.currentTarget.style.background = '')}
                  >
                    <td style={{ padding: '10px 12px' }}>
                      <span style={{ color: C.muted, fontSize: 11, marginRight: 5, userSelect: 'none' }}>{isExpanded ? '▼' : '▶'}</span>
                      <a href={`${GH}/issues/${i.number}`} target="_blank" rel="noreferrer"
                         onClick={e => e.stopPropagation()}
                         style={{ color: C.text, fontWeight: 500, textDecoration: 'none' }}>
                        {i.title}
                      </a>
                      <span style={{ color: C.faint, fontSize: 11, marginLeft: 6 }}>#{i.number}</span>
                      {unassigned && (
                        <span style={{ marginLeft: 8, fontSize: 10, color: C.red, background: 'rgba(226,75,74,0.15)', padding: '1px 6px', borderRadius: 8 }}>Unassigned</span>
                      )}
                      {!i.totalSubIssues && (
                        <span style={{ marginLeft: 8, fontSize: 10, color: C.muted, background: 'rgba(255,255,255,0.07)', padding: '1px 6px', borderRadius: 8 }}>Not planned yet</span>
                      )}
                      {i.planChanged && i.subIssuesAdded > 0 && (
                        <span style={{ marginLeft: 8, fontSize: 10, color: C.yellow, background: 'rgba(245,200,66,0.12)', padding: '1px 6px', borderRadius: 8 }}>
                          📋 Plan updated (+{i.subIssuesAdded} task{i.subIssuesAdded === 1 ? '' : 's'})
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '10px 12px' }}><TeamBadge team={i.team} /></td>
                    <td style={{ padding: '10px 12px' }}><StatusBadge status={i.status} /></td>
                    <td style={{ padding: '10px 12px' }}>
                      {d !== null ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <ProgBar pct={d} tooltip={tooltip} />
                          {ca && (
                            <span title={`Code: ${codeAvg}% — ${codeAheadReason(i)}`}
                                  style={{ fontSize: 10, color: C.purple, fontWeight: 600, cursor: 'help' }}>
                              ↑ code
                            </span>
                          )}
                        </div>
                      ) : <span style={{ color: C.faint }}>—</span>}
                    </td>
                    <td style={{ padding: '10px 12px' }}>{fmtImplDate(i)}</td>
                    <td style={{ padding: '10px 12px', fontSize: 12, color: C.muted }}>{i.assignee}</td>
                  </tr>
                  {isExpanded && <DetailCard i={i} />}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Shipped this week */}
      <div style={{ marginTop: 32 }}>
        <button
          onClick={() => setShowShipped(v => !v)}
          style={{ background: 'none', border: 'none', color: C.muted, cursor: 'pointer', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', padding: 0, display: 'flex', alignItems: 'center', gap: 6 }}
        >
          <span style={{ fontSize: 10 }}>{showShipped ? '▼' : '▶'}</span>
          Shipped This Week
        </button>
        {showShipped && (
          <div style={{ marginTop: 12 }}>
            <ShippedTable shipped={shipped} />
          </div>
        )}
      </div>

      {/* All detail cards */}
      <div style={{ marginTop: 32 }}>
        <div style={{ fontSize: 11, color: C.muted, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>
          All Issues — Task Detail
        </div>
        {initiatives.filter(i => i.totalSubIssues > 0).map(i => {
          const d = deliveredPct(i);
          const col = barColor(d ?? 0);
          const isExpanded = expanded.has(i.number * -1);
          return (
            <div key={i.number} style={{ marginBottom: 6, borderRadius: 10, border: '1px solid rgba(255,255,255,0.07)', overflow: 'hidden' }}>
              <div
                onClick={() => {
                  const k = i.number * -1;
                  setExpanded(prev => { const s = new Set(prev); s.has(k) ? s.delete(k) : s.add(k); return s; });
                }}
                style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', cursor: 'pointer', background: 'rgba(255,255,255,0.02)' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.04)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.02)')}
              >
                <span style={{ color: C.muted, fontSize: 10 }}>{isExpanded ? '▼' : '▶'}</span>
                <span style={{ flex: 1, color: C.text, fontSize: 13, fontWeight: 500 }}>{i.title}</span>
                <TeamBadge team={i.team} />
                <span style={{ color: C.muted, fontSize: 11 }}>#{i.number} · {i.assignee}</span>
                <span style={{ color: C.muted, fontSize: 11 }}>{i.closedSubIssues}/{i.totalSubIssues} done</span>
                <div style={{ width: 70, height: 5, background: 'rgba(255,255,255,0.08)', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ width: `${d ?? 0}%`, height: '100%', background: col }} />
                </div>
                <span style={{ color: col, fontSize: 12, fontWeight: 700, minWidth: 36, textAlign: 'right' }}>{d ?? 0}%</span>
              </div>
              {isExpanded && (
                <div style={{ padding: '4px 14px 14px 28px', background: 'rgba(255,255,255,0.01)' }}>
                  {/* mini sub-issue table */}
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, marginTop: 8 }}>
                    <thead>
                      <tr style={{ color: C.muted, fontSize: 10, fontWeight: 600, textTransform: 'uppercase' }}>
                        <th style={{ textAlign: 'left', padding: '4px 8px', width: 48 }}>#</th>
                        <th style={{ textAlign: 'left', padding: '4px 8px' }}>Task</th>
                        <th style={{ textAlign: 'center', padding: '4px 8px', width: 46 }}>Size</th>
                        <th style={{ textAlign: 'center', padding: '4px 8px', width: 76 }}>Delivered</th>
                        <th style={{ textAlign: 'left', padding: '4px 8px', width: 96 }}>Status</th>
                        <th style={{ textAlign: 'left', padding: '4px 8px' }}>Notes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {i.subIssues.map(s => {
                        const isManual = s.state !== 'CLOSED' && (s.workType === 'testing' || s.workType === 'decision');
                        const dv = isManual ? 0 : subDelivered(s);
                        const dvCol = barColor(dv);
                        const gap = (s.score || 0) > dv && s.deliveredReason;
                        const noteText = gap ? s.deliveredReason : (s.reason || '');
                        const note = noteText ? (noteText.length > 70 ? noteText.slice(0, 68) + '…' : noteText) : '—';
                        const sizes: Record<string, string> = { 1: 'S', 3: 'M', 5: 'L' };
                        const szLabel = sizes[String(s.cx)] ?? 'S';
                        const szColor = szLabel === 'L' ? C.red : szLabel === 'M' ? C.yellow : C.green;
                        return (
                          <tr key={s.number} style={{ opacity: s.state === 'CLOSED' ? 0.55 : 1, borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                            <td style={{ padding: '5px 8px' }}>
                              <a href={`${GH}/issues/${s.number}`} target="_blank" rel="noreferrer" style={{ color: C.muted }}>#{s.number}</a>
                            </td>
                            <td style={{ padding: '5px 8px', color: C.text, maxWidth: 260 }}>
                              {s.title}
                              {s.risk === 'high' && <span style={{ marginLeft: 5, fontSize: 10, color: C.red, fontWeight: 600 }}>⚠ High risk</span>}
                              {s.workType && s.workType !== 'code' && <span style={{ marginLeft: 5, fontSize: 10, color: C.muted, background: 'rgba(255,255,255,0.07)', padding: '1px 5px', borderRadius: 6 }}>{s.workType}</span>}
                            </td>
                            <td style={{ padding: '5px 8px', textAlign: 'center' }}>
                              <span style={{ fontSize: 10, fontWeight: 700, color: szColor, background: szColor + '22', padding: '1px 6px', borderRadius: 8 }}>{szLabel}</span>
                            </td>
                            <td style={{ padding: '5px 8px', textAlign: 'center', color: dvCol, fontWeight: 600 }}>
                              <span title={gap ? s.deliveredReason : undefined} style={{ borderBottom: gap ? '1px dotted rgba(255,255,255,0.3)' : undefined, cursor: gap ? 'help' : undefined }}>
                                {dv}%
                              </span>
                            </td>
                            <td style={{ padding: '5px 8px' }}><StageBadge s={s} /></td>
                            <td style={{ padding: '5px 8px', color: C.muted }}>
                              <span title={noteText} style={{ cursor: noteText ? 'help' : undefined, borderBottom: noteText ? '1px dotted rgba(255,255,255,0.2)' : undefined }}>
                                {note}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
