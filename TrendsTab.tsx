import React, { useMemo } from 'react';
import {
  BarChart, Bar, ReferenceLine,
  LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { HistoryEntry, ShippedItem, StatusLog, CycleDataItem, Initiative } from '../types';
import { C, weekMonday, fmtShortDate, statusColors } from '../utils';

// ── helpers ───────────────────────────────────────────────────────────────────

// Build the set of completed weeks anchored to actual SHIPPED dates (same logic as HTML dashboard)
function shippedWeekKeys(shipped: ShippedItem[]): string[] {
  const wkSet = new Set<string>();
  shipped.forEach(s => {
    if (!s.closedAt) return;
    const wk = weekMonday(s.closedAt);
    if (wk) wkSet.add(wk);
  });
  return [...wkSet].sort();
}

// ── Latest snapshot by board ──────────────────────────────────────────────────

function SnapshotByBoard({ initiatives }: { initiatives: Initiative[] }) {
  const boards = useMemo(() => {
    const map: Record<string, { shipped: number; inReview: number; inProgress: number; notStarted: number; total: number }> = {};
    initiatives.forEach(i => {
      const b = i.team || 'Other';
      if (!map[b]) map[b] = { shipped: 0, inReview: 0, inProgress: 0, notStarted: 0, total: 0 };
      map[b].shipped    += (i.closedSubIssues || 0);
      map[b].inReview   += (i.subIssuesWithPR || 0);
      map[b].notStarted += (i.subIssuesNoActivity || 0);
      const open = i.openSubIssues || 0;
      map[b].inProgress += Math.max(0, open - (i.subIssuesWithPR || 0) - (i.subIssuesNoActivity || 0));
      map[b].total      += (i.totalSubIssues || 0);
    });
    return map;
  }, [initiatives]);

  const boardNames = Object.keys(boards);
  if (!boardNames.length) return null;

  return (
    <div style={{ marginBottom: 32 }}>
      <div style={{ fontSize: 11, color: C.muted, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>
        Latest Snapshot by Board
      </div>
      <div style={{ fontSize: 12, color: C.muted, marginBottom: 12 }}>
        Beaky Blinders (ENT 1) and Team Raven (ENT 2) side by side.
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ borderCollapse: 'collapse', fontSize: 12, minWidth: 420 }}>
          <thead>
            <tr style={{ color: C.muted, fontSize: 10, fontWeight: 600, textTransform: 'uppercase', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
              <th style={{ textAlign: 'left', padding: '8px 12px', minWidth: 140 }}>Board</th>
              <th style={{ textAlign: 'center', padding: '8px 12px', width: 80 }}>Shipped</th>
              <th style={{ textAlign: 'center', padding: '8px 12px', width: 80 }}>In Review</th>
              <th style={{ textAlign: 'center', padding: '8px 12px', width: 90 }}>In Progress</th>
              <th style={{ textAlign: 'center', padding: '8px 12px', width: 90 }}>Not Started</th>
              <th style={{ textAlign: 'center', padding: '8px 12px', width: 70 }}>% Done</th>
            </tr>
          </thead>
          <tbody>
            {boardNames.map(name => {
              const b = boards[name];
              const pct = b.total ? Math.round(b.shipped / b.total * 100) : 0;
              const chipBg = name === 'Beaky Blinders' ? 'rgba(155,143,248,0.25)' : 'rgba(93,212,168,0.25)';
              const chipColor = name === 'Beaky Blinders' ? C.purple : C.green;
              return (
                <tr key={name} style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                  <td style={{ padding: '8px 12px' }}>
                    <span style={{ padding: '2px 8px', borderRadius: 8, background: chipBg, color: chipColor, fontWeight: 600, fontSize: 11 }}>{name}</span>
                  </td>
                  <td style={{ padding: '8px 12px', textAlign: 'center', color: C.text, fontWeight: 600 }}>{b.shipped}</td>
                  <td style={{ padding: '8px 12px', textAlign: 'center', color: C.text, fontWeight: 600 }}>{b.inReview}</td>
                  <td style={{ padding: '8px 12px', textAlign: 'center', color: C.text, fontWeight: 600 }}>{b.inProgress}</td>
                  <td style={{ padding: '8px 12px', textAlign: 'center', color: C.text, fontWeight: 600 }}>{b.notStarted}</td>
                  <td style={{ padding: '8px 12px', textAlign: 'center', fontWeight: 700, color: pct >= 75 ? C.green : pct >= 40 ? C.yellow : C.red }}>{pct}%</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Throughput — combined total, last 2 weeks ─────────────────────────────────

function ThroughputChart({ shipped }: { shipped: ShippedItem[] }) {
  const { data, avg } = useMemo(() => {
    const allWks = shippedWeekKeys(shipped);
    const wks = allWks.slice(-2);
    const rows = wks.map(wk => {
      const start = new Date(wk + 'T00:00:00Z');
      const end   = new Date(wk + 'T00:00:00Z');
      end.setUTCDate(end.getUTCDate() + 7);
      const count = shipped.filter(s => {
        if (!s.closedAt) return false;
        const d = new Date(s.closedAt.length === 10 ? s.closedAt + 'T00:00:00Z' : s.closedAt);
        return d >= start && d < end;
      }).length;
      return { week: 'Wk ' + wk.substring(5), count };
    });
    const a = rows.length ? Math.round(rows.reduce((s, r) => s + r.count, 0) / rows.length * 10) / 10 : 0;
    return { data: rows, avg: a };
  }, [shipped]);

  if (!data.length) return <div style={{ color: C.faint, fontSize: 13 }}>No throughput data yet.</div>;

  return (
    <div style={{ marginBottom: 32 }}>
      <div style={{ fontSize: 11, color: C.muted, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>
        Throughput — Sub-issues shipped per week
      </div>
      <div style={{ fontSize: 12, color: C.muted, marginBottom: 12 }}>
        Last 2 weeks — combined total across Beaky Blinders and Raven. Dashed line = 2-week average ({avg} sub-issues/week).
      </div>
      <div style={{ height: 220 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} barGap={4}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
            <XAxis dataKey="week" tick={{ fill: C.muted, fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: C.muted, fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
            <Tooltip
              contentStyle={{ background: '#1A1A28', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, fontSize: 12 }}
              labelStyle={{ color: C.text, fontWeight: 600 }}
              cursor={{ fill: 'rgba(255,255,255,0.04)' }}
            />
            <Legend wrapperStyle={{ fontSize: 11, color: C.muted }} />
            <Bar dataKey="count" name="Sub-issues shipped" fill={C.green} radius={[4, 4, 0, 0]} />
            <ReferenceLine y={avg} stroke="rgba(255,255,255,0.4)" strokeDasharray="6 4" label={{ value: `2-wk avg (${avg})`, position: 'insideTopRight', fill: 'rgba(255,255,255,0.5)', fontSize: 10 }} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// ── Throughput by developer — last 2 weeks ────────────────────────────────────

function DeveloperChart({ shipped }: { shipped: ShippedItem[] }) {
  const { data, engineers } = useMemo(() => {
    const allWks = shippedWeekKeys(shipped);
    const wks = allWks.slice(-2);
    const devMap: Record<string, Record<string, number>> = {};
    const engSet = new Set<string>();
    wks.forEach(wk => {
      const start = new Date(wk + 'T00:00:00Z');
      const end   = new Date(wk + 'T00:00:00Z');
      end.setUTCDate(end.getUTCDate() + 7);
      shipped.forEach(s => {
        if (!s.closedAt || !s.engineer) return;
        const d = new Date(s.closedAt.length === 10 ? s.closedAt + 'T00:00:00Z' : s.closedAt);
        if (d < start || d >= end) return;
        const label = 'Wk ' + wk.substring(5);
        if (!devMap[s.engineer]) devMap[s.engineer] = {};
        devMap[s.engineer][label] = (devMap[s.engineer][label] || 0) + 1;
        engSet.add(s.engineer);
      });
    });
    const wkLabels = wks.map(wk => 'Wk ' + wk.substring(5));
    const engs = [...engSet].sort((a, b) => {
      const ta = wkLabels.reduce((s, l) => s + (devMap[a][l] || 0), 0);
      const tb = wkLabels.reduce((s, l) => s + (devMap[b][l] || 0), 0);
      return tb - ta;
    });
    const rows = wkLabels.map(label => {
      const row: Record<string, string | number> = { week: label };
      engs.forEach(e => { row[e] = devMap[e]?.[label] || 0; });
      return row;
    });
    return { data: rows, engineers: engs };
  }, [shipped]);

  const COLORS = [C.purple, C.green, C.orange, C.red, C.blue, C.yellow, '#FF9B9B', '#A0D8F0'];

  if (!data.length || !engineers.length) return null;

  return (
    <div style={{ marginBottom: 32 }}>
      <div style={{ fontSize: 11, color: C.muted, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>
        Throughput by Developer
      </div>
      <div style={{ fontSize: 12, color: C.muted, marginBottom: 12 }}>
        Sub-issues closed per week by engineer — last 2 weeks.
      </div>
      <div style={{ height: 260 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
            <XAxis dataKey="week" tick={{ fill: C.muted, fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: C.muted, fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
            <Tooltip
              contentStyle={{ background: '#1A1A28', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, fontSize: 12 }}
              labelStyle={{ color: C.text, fontWeight: 600 }}
            />
            <Legend wrapperStyle={{ fontSize: 11, color: C.muted }} />
            {engineers.map((eng, i) => (
              <Line
                key={eng}
                type="monotone"
                dataKey={eng}
                stroke={COLORS[i % COLORS.length]}
                strokeWidth={2}
                dot={{ r: 5, fill: COLORS[i % COLORS.length] }}
                activeDot={{ r: 7 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// ── Cycle time table ──────────────────────────────────────────────────────────

function CycleTimeTable({ cycleData }: { cycleData: CycleDataItem[] }) {
  if (!cycleData.length) return null;

  const medOf = (k: keyof CycleDataItem) => {
    const vals = cycleData.map(d => d[k] as number).filter(v => v != null);
    if (!vals.length) return null;
    const s = [...vals].sort((a, b) => a - b);
    return s.length % 2 ? s[Math.floor(s.length / 2)] : Math.round((s[Math.floor(s.length / 2) - 1] + s[Math.floor(s.length / 2)]) / 2);
  };

  const medDesign = medOf('designDays');
  const medPlan   = medOf('planDays');

  return (
    <div style={{ marginBottom: 32 }}>
      <div style={{ fontSize: 11, color: C.muted, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>
        Time in Stage &amp; Flow Time
      </div>
      <div style={{ fontSize: 12, color: C.muted, marginBottom: 12 }}>
        Time in Design: <strong style={{ color: C.text }}>{medDesign != null ? medDesign + 'd median' : 'accumulating'}</strong>
        &nbsp;·&nbsp;Time in Planning: <strong style={{ color: C.text }}>{medPlan != null ? medPlan + 'd median' : 'accumulating'}</strong>
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <thead>
            <tr style={{ color: C.muted, fontSize: 10, fontWeight: 600, textTransform: 'uppercase', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
              <th style={{ textAlign: 'left', padding: '7px 10px' }}>Issue</th>
              <th style={{ textAlign: 'left', padding: '7px 10px', width: 100 }}>Status</th>
              <th style={{ textAlign: 'center', padding: '7px 10px', width: 70 }}>Sub-issues</th>
              <th style={{ textAlign: 'center', padding: '7px 10px', width: 100 }}>Time in Design</th>
              <th style={{ textAlign: 'center', padding: '7px 10px', width: 100 }}>Time in Planning</th>
              <th style={{ textAlign: 'center', padding: '7px 10px', width: 140 }}>Sub-issue cycle</th>
              <th style={{ textAlign: 'center', padding: '7px 10px', width: 110 }}>Lead time</th>
            </tr>
          </thead>
          <tbody>
            {cycleData.map(d => (
              <tr key={d.number} style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                <td style={{ padding: '7px 10px', color: C.text }}>
                  {d.name}
                  <div style={{ marginTop: 2 }}>
                    <span style={{
                      fontSize: 10, padding: '1px 6px', borderRadius: 8,
                      background: d.board === 'Beaky Blinders' ? 'rgba(155,143,248,0.2)' : 'rgba(93,212,168,0.15)',
                      color: d.board === 'Beaky Blinders' ? C.purple : C.green,
                    }}>{d.board}</span>
                  </div>
                </td>
                <td style={{ padding: '7px 10px' }}>
                  {d.status === 'complete'
                    ? <span style={{ color: C.green, fontWeight: 600 }}>done</span>
                    : <span style={{ color: C.orange, fontWeight: 600 }}>active · {d.activeDays}d</span>}
                </td>
                <td style={{ padding: '7px 10px', textAlign: 'center', color: C.muted }}>{d.subCount}</td>
                <td style={{ padding: '7px 10px', textAlign: 'center', color: C.muted }}>{d.designDays != null ? d.designDays + 'd' : '—'}</td>
                <td style={{ padding: '7px 10px', textAlign: 'center', color: C.muted }}>{d.planDays != null ? d.planDays + 'd' : '—'}</td>
                <td style={{ padding: '7px 10px', textAlign: 'center', color: C.muted }}>{d.avgSubDays}d avg / {d.maxSubDays}d max</td>
                <td style={{ padding: '7px 10px', textAlign: 'center', color: C.muted }}>{d.leadDays != null ? d.leadDays + 'd' : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Flow times from STATUS_LOG ────────────────────────────────────────────────

function FlowTimesTable({ statusLog, initiatives }: { statusLog: StatusLog; initiatives: Initiative[] }) {
  const today = new Date().toISOString().slice(0, 10);
  const STAGE_ORDER = ['Design', 'Plan', 'Implementation', 'Review', 'Retrospective'];

  const slEntry: Record<string, Record<string, string>> = {};
  (statusLog?.transitions ?? []).forEach(t => {
    if (t.seeded) return;
    const n = String(t.number);
    slEntry[n] = slEntry[n] || {};
    if (!slEntry[n][t.to]) slEntry[n][t.to] = t.date;
  });

  const D = (a: string, b: string) => Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86400000);
  const active = initiatives.filter(i => i.status !== 'Retrospective');

  if (!active.length) return null;

  return (
    <div style={{ marginBottom: 32 }}>
      <div style={{ fontSize: 11, color: C.muted, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>
        Flow Times — Active Issues
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
        <thead>
          <tr style={{ color: C.muted, fontSize: 10, fontWeight: 600, textTransform: 'uppercase', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
            <th style={{ textAlign: 'left', padding: '7px 10px' }}>Issue</th>
            <th style={{ textAlign: 'left', padding: '7px 10px', width: 100 }}>Stage</th>
            <th style={{ textAlign: 'center', padding: '7px 10px', width: 100 }}>In Design</th>
            <th style={{ textAlign: 'center', padding: '7px 10px', width: 100 }}>In Planning</th>
            <th style={{ textAlign: 'center', padding: '7px 10px', width: 100 }}>Cycle time</th>
          </tr>
        </thead>
        <tbody>
          {active.map(ini => {
            const n = String(ini.number);
            const sl = slEntry[n] || {};
            const stageDate = (ghField: string | null | undefined, stage: string) => ghField || sl[stage] || null;
            const dSince = stageDate(ini.designSince, 'Design');
            const pSince = stageDate(ini.planSince, 'Plan');
            const iSince = stageDate(ini.implSince, 'Implementation');
            const stageIdx = STAGE_ORDER.indexOf(ini.status);

            const designCell = (() => {
              if (!dSince) return '—';
              const end = pSince || iSince || (stageIdx > 0 ? today : null);
              if (!end) return '—';
              const d = D(dSince, end);
              const ongoing = !pSince && !iSince && stageIdx === 0;
              return d >= 0 ? d + 'd' + (ongoing ? ' (ongoing)' : '') : '—';
            })();

            const planCell = (() => {
              if (!pSince) return '—';
              const end = iSince || (stageIdx <= 1 ? today : null);
              if (!end) return '—';
              const d = D(pSince, end);
              const ongoing = !iSince && stageIdx === 1;
              return d >= 0 ? d + 'd' + (ongoing ? ' (ongoing)' : '') : '—';
            })();

            const cycleCell = (() => {
              if (!iSince) return '—';
              const end = ini.retroSince || (['Implementation', 'Review'].includes(ini.status) ? today : null);
              if (!end) return '—';
              const d = D(iSince, end);
              const ongoing = !ini.retroSince && ['Implementation', 'Review'].includes(ini.status);
              return d >= 0 ? d + 'd' + (ongoing ? ' (ongoing)' : '') : '—';
            })();

            return (
              <tr key={ini.number} style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                <td style={{ padding: '7px 10px', color: C.text }}>
                  {ini.title.replace(/^Plan:\s*/i, '').replace(/^\[.*?\]\s*/, '')}
                  <span style={{ color: C.faint, fontSize: 11, marginLeft: 6 }}>#{ini.number}</span>
                </td>
                <td style={{ padding: '7px 10px', color: C.muted, fontSize: 11 }}>{ini.status}</td>
                <td style={{ padding: '7px 10px', textAlign: 'center', color: C.muted }}>{designCell}</td>
                <td style={{ padding: '7px 10px', textAlign: 'center', color: C.muted }}>{planCell}</td>
                <td style={{ padding: '7px 10px', textAlign: 'center', color: C.muted }}>{cycleCell}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ── main export ───────────────────────────────────────────────────────────────

export function TrendsTab({
  shipped,
  history,
  statusLog,
  cycleData,
  initiatives,
}: {
  shipped: ShippedItem[];
  history: HistoryEntry[];
  statusLog: StatusLog;
  cycleData: CycleDataItem[];
  initiatives: Initiative[];
}) {
  return (
    <div>
      <SnapshotByBoard initiatives={initiatives} />
      <ThroughputChart shipped={shipped} />
      <DeveloperChart shipped={shipped} />
      <CycleTimeTable cycleData={cycleData} />
      <FlowTimesTable statusLog={statusLog} initiatives={initiatives} />
    </div>
  );
}
