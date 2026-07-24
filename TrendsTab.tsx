import React, { useMemo } from 'react';
import {
  BarChart, Bar, Cell, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { HistoryEntry, ShippedItem, StatusLog, CycleDataItem, Initiative } from '../types';
import { C, normalizeHistory, weekMonday, fmtShortDate, statusColors } from '../utils';

// ── Throughput chart ──────────────────────────────────────────────────────

function ThroughputChart({ shipped }: { shipped: ShippedItem[] }) {
  const data = useMemo(() => {
    const wkMap: Record<string, { week: string; Beaky: number; Raven: number; Other: number }> = {};
    shipped.forEach(s => {
      if (!s.closedAt) return;
      const wk = weekMonday(s.closedAt);
      if (!wkMap[wk]) wkMap[wk] = { week: fmtShortDate(wk), Beaky: 0, Raven: 0, Other: 0 };
      if (s.team === 'Beaky Blinders') wkMap[wk].Beaky++;
      else if (s.team === 'Raven') wkMap[wk].Raven++;
      else wkMap[wk].Other++;
    });
    return Object.keys(wkMap).sort().slice(-2).map(k => wkMap[k]);
  }, [shipped]);

  if (!data.length) return <div style={{ color: C.faint, fontSize: 13 }}>No shipped data yet.</div>;

  return (
    <div style={{ marginBottom: 32 }}>
      <div style={{ fontSize: 11, color: C.muted, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 14 }}>
        Throughput — Last 2 weeks
      </div>
      <div style={{ height: 200 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} barGap={4}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
            <XAxis dataKey="week" tick={{ fill: C.muted, fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: C.muted, fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
            <Tooltip
              contentStyle={{ background: '#1A1A28', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, fontSize: 12 }}
              labelStyle={{ color: C.text, fontWeight: 600 }}
              itemStyle={{ color: C.text }}
            />
            <Legend wrapperStyle={{ fontSize: 11, color: C.muted }} />
            <Bar dataKey="Beaky" name="Beaky Blinders" fill={C.purple} radius={[3, 3, 0, 0]} />
            <Bar dataKey="Raven" name="Raven" fill={C.green} radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div style={{ fontSize: 11, color: C.muted, marginTop: 4 }}>
        2-wk avg: {(data.reduce((a, d) => a + d.Beaky + d.Raven + d.Other, 0) / Math.max(data.length, 1)).toFixed(1)} sub-issues/week
      </div>
    </div>
  );
}

// ── Developer contribution chart (line) ──────────────────────────────────

function DeveloperChart({ shipped }: { shipped: ShippedItem[] }) {
  const { data, engineers } = useMemo(() => {
    const wkMap: Record<string, Record<string, number>> = {};
    const engSet = new Set<string>();
    shipped.forEach(s => {
      if (!s.closedAt) return;
      const wk = weekMonday(s.closedAt);
      const eng = s.engineer || 'unknown';
      if (!wkMap[wk]) wkMap[wk] = { week: fmtShortDate(wk) };
      wkMap[wk][eng] = (wkMap[wk][eng] || 0) + 1;
      engSet.add(eng);
    });
    const wks = Object.keys(wkMap).sort().slice(-4);
    const engs = [...engSet].filter(e => e !== 'unknown').sort();
    return {
      data: wks.map(k => ({ ...wkMap[k] })),
      engineers: engs,
    };
  }, [shipped]);

  const ENG_COLORS = [C.green, C.purple, C.blue, C.yellow, C.orange, '#FF9B9B', '#A0D8F0', '#C5A3FF'];

  if (!data.length || !engineers.length) return null;

  return (
    <div style={{ marginBottom: 32 }}>
      <div style={{ fontSize: 11, color: C.muted, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 14 }}>
        Throughput by Developer — last 4 weeks
      </div>
      <div style={{ height: 200 }}>
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
                stroke={ENG_COLORS[i % ENG_COLORS.length]}
                strokeWidth={2}
                dot={{ r: 3, fill: ENG_COLORS[i % ENG_COLORS.length] }}
                activeDot={{ r: 5 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// ── Status distribution bar chart ─────────────────────────────────────────

function StatusDistChart({ initiatives }: { initiatives: Initiative[] }) {
  const STATUS_ORDER = ['Proposal', 'Design', 'Plan', 'Implementation', 'Review', 'Retrospective'];
  const data = useMemo(() => {
    const counts: Record<string, number> = {};
    STATUS_ORDER.forEach(s => (counts[s] = 0));
    initiatives.forEach(i => { counts[i.status] = (counts[i.status] || 0) + 1; });
    return STATUS_ORDER.filter(s => counts[s] > 0).map(s => ({ status: s, count: counts[s], fill: statusColors[s] || C.muted }));
  }, [initiatives]);

  if (!data.length) return null;

  return (
    <div style={{ marginBottom: 32 }}>
      <div style={{ fontSize: 11, color: C.muted, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 14 }}>
        Issues by Stage
      </div>
      <div style={{ height: 160 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" horizontal={false} />
            <XAxis type="number" tick={{ fill: C.muted, fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
            <YAxis type="category" dataKey="status" tick={{ fill: C.muted, fontSize: 11 }} axisLine={false} tickLine={false} width={100} />
            <Tooltip
              contentStyle={{ background: '#1A1A28', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, fontSize: 12 }}
              cursor={{ fill: 'rgba(255,255,255,0.04)' }}
            />
            <Bar dataKey="count" radius={[0, 4, 4, 0]}>
              {data.map((entry, i) => (
                <Cell key={i} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// ── Cycle time table ──────────────────────────────────────────────────────

function CycleTimeTable({ cycleData }: { cycleData: CycleDataItem[] }) {
  if (!cycleData.length) return <div style={{ color: C.faint, fontSize: 13 }}>No cycle time data yet.</div>;

  const medOf = (k: keyof CycleDataItem) => {
    const vals = cycleData.map(d => d[k] as number).filter(v => v != null);
    if (!vals.length) return null;
    const s = [...vals].sort((a, b) => a - b);
    return s.length % 2 ? s[Math.floor(s.length / 2)] : Math.round((s[Math.floor(s.length / 2) - 1] + s[Math.floor(s.length / 2)]) / 2);
  };

  const medDesign = medOf('designDays');
  const medPlan = medOf('planDays');

  return (
    <div style={{ marginBottom: 32 }}>
      <div style={{ fontSize: 11, color: C.muted, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
        Time in stage &amp; flow time
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
                    ? <span style={{ color: C.green, fontWeight: 600 }}>✓ done</span>
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

// ── Flow times from STATUS_LOG ────────────────────────────────────────────

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
        Flow Times — active issues
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

// ── Latest snapshot by board ──────────────────────────────────────────────

function SnapshotByBoard({ initiatives }: { initiatives: Initiative[] }) {
  const compute = (filter: (i: Initiative) => boolean) => {
    const inits = initiatives.filter(filter);
    const shipped   = inits.filter(i => i.status === 'Retrospective').length;
    const inReview  = inits.filter(i => i.status === 'Review').length;
    const inProgress= inits.filter(i => i.status === 'Implementation').length;
    const notStarted= inits.filter(i => ['Proposal','Design','Plan'].includes(i.status)).length;
    const totalSubs = inits.reduce((a, i) => a + i.totalSubIssues, 0);
    const closedSubs= inits.reduce((a, i) => a + i.closedSubIssues, 0);
    const pctDone   = totalSubs > 0 ? Math.round(closedSubs / totalSubs * 100) : 0;
    return { total: inits.length, shipped, inReview, inProgress, notStarted, pctDone };
  };
  const bb = compute(i => i.team === 'Beaky Blinders' || i.team === 'Both');
  const rv = compute(i => i.team === 'Raven' || i.team === 'Both');

  const Row = ({ label, bbVal, rvVal }: { label: string; bbVal: number; rvVal: number }) => (
    <tr style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
      <td style={{ padding: '7px 12px', color: C.muted, fontSize: 12 }}>{label}</td>
      <td style={{ padding: '7px 12px', textAlign: 'center', color: C.text, fontWeight: 600, fontSize: 13 }}>{bbVal}</td>
      <td style={{ padding: '7px 12px', textAlign: 'center', color: C.text, fontWeight: 600, fontSize: 13 }}>{rvVal}</td>
    </tr>
  );

  return (
    <div style={{ marginBottom: 32 }}>
      <div style={{ fontSize: 11, color: C.muted, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>
        Latest Snapshot by Board
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ borderCollapse: 'collapse', fontSize: 12, minWidth: 360 }}>
          <thead>
            <tr style={{ color: C.muted, fontSize: 10, fontWeight: 600, textTransform: 'uppercase', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
              <th style={{ textAlign: 'left', padding: '8px 12px', minWidth: 140 }}></th>
              <th style={{ textAlign: 'center', padding: '8px 12px', width: 130 }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: '#9B8FF8' }}>Beaky Blinders</span>
              </th>
              <th style={{ textAlign: 'center', padding: '8px 12px', width: 130 }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: '#5DD4A8' }}>Raven</span>
              </th>
            </tr>
          </thead>
          <tbody>
            <Row label="Total issues"    bbVal={bb.total}       rvVal={rv.total} />
            <Row label="Shipped"         bbVal={bb.shipped}     rvVal={rv.shipped} />
            <Row label="In Review"       bbVal={bb.inReview}    rvVal={rv.inReview} />
            <Row label="In Progress"     bbVal={bb.inProgress}  rvVal={rv.inProgress} />
            <Row label="Not Started"     bbVal={bb.notStarted}  rvVal={rv.notStarted} />
            <tr style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
              <td style={{ padding: '7px 12px', color: C.muted, fontSize: 12 }}>% done (sub-issues)</td>
              <td style={{ padding: '7px 12px', textAlign: 'center', fontWeight: 700, fontSize: 13, color: bb.pctDone >= 75 ? C.green : bb.pctDone >= 40 ? C.yellow : C.red }}>{bb.pctDone}%</td>
              <td style={{ padding: '7px 12px', textAlign: 'center', fontWeight: 700, fontSize: 13, color: rv.pctDone >= 75 ? C.green : rv.pctDone >= 40 ? C.yellow : C.red }}>{rv.pctDone}%</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── main export ──────────────────────────────────────────────────────────

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
      <StatusDistChart initiatives={initiatives} />
      <CycleTimeTable cycleData={cycleData} />
      <FlowTimesTable statusLog={statusLog} initiatives={initiatives} />
    </div>
  );
}
