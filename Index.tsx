import React, { useState, useMemo } from 'react';
import { useDashboard } from '../hooks/useDashboard';
import { IssueTrackerTab } from '../components/IssueTrackerTab';
import { TrendsTab } from '../components/TrendsTab';
import { RoadmapTab } from '../components/RoadmapTab';
import { BugsTab } from '../components/BugsTab';
import { SupportTab } from '../components/SupportTab';
import { BlockersTab } from '../components/BlockersTab';
import { C, blockerInclude } from '../utils';
import { TeamFilter, TabId, Initiative } from '../types';

// ── KPI card ──────────────────────────────────────────────────────────────

function KpiCard({
  label, value, sub, color,
}: {
  label: string; value: React.ReactNode; sub: string; color: string;
}) {
  return (
    <div style={{
      flex: 1, minWidth: 130, borderRadius: 12, padding: '18px 20px',
      background: `linear-gradient(135deg, ${color}30, ${color}10)`,
      border: `1px solid ${color}55`,
    }}>
      <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', opacity: 0.7, marginBottom: 8, color: C.text }}>{label}</div>
      <div style={{ fontSize: 32, fontWeight: 700, lineHeight: 1, color: C.text }}>{value}</div>
      <div style={{ fontSize: 11, opacity: 0.55, marginTop: 5, color: C.text }}>{sub}</div>
    </div>
  );
}

// ── tab button ────────────────────────────────────────────────────────────

function TabBtn({ id, label, active, onClick }: { id: string; label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        background: active ? 'rgba(255,255,255,0.1)' : 'none',
        border: 'none',
        borderBottom: active ? `2px solid ${C.green}` : '2px solid transparent',
        color: active ? C.text : C.muted,
        padding: '8px 16px',
        cursor: 'pointer',
        fontSize: 13,
        fontWeight: active ? 600 : 400,
        borderRadius: active ? '6px 6px 0 0' : undefined,
        transition: 'all 0.15s',
        whiteSpace: 'nowrap',
      }}
    >
      {label}
    </button>
  );
}

// ── team filter chip ──────────────────────────────────────────────────────

function TeamChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        background: active ? 'rgba(93,212,168,0.15)' : 'rgba(255,255,255,0.05)',
        border: active ? `1px solid ${C.green}55` : '1px solid rgba(255,255,255,0.1)',
        color: active ? C.green : C.muted,
        padding: '5px 12px',
        borderRadius: 20,
        cursor: 'pointer',
        fontSize: 12,
        fontWeight: active ? 600 : 400,
        transition: 'all 0.15s',
      }}
    >
      {label}
    </button>
  );
}

// ── main page ─────────────────────────────────────────────────────────────

export default function Index() {
  const { data, loading, error, refetch } = useDashboard();
  const [team, setTeam] = useState<TeamFilter>('all');
  const [tab, setTab] = useState<TabId>('overview');

  const inScope = (i: Initiative) => team === 'all' || i.team === team || i.team === 'Both';

  const vis = useMemo(() => (data?.initiatives ?? []).filter(inScope), [data, team]);

  // KPI calculations
  const kpi = useMemo(() => {
    if (!data) return { blocked: 0, blockedNums: [] as number[], shippedWk: 0 };
    const blockedSubNums: number[] = [];
    vis.forEach(i => i.subIssues.forEach(s => { if (blockerInclude(s)) blockedSubNums.push(s.number); }));
    const cutoff = Date.now() - 7 * 86400000;
    const shippedWk = (data.shipped ?? []).filter(s => s.closedAt && new Date(s.closedAt).getTime() >= cutoff).length;
    return { blocked: blockedSubNums.length, blockedNums: blockedSubNums, shippedWk };
  }, [vis, data]);

  const blockedSub = kpi.blockedNums.length
    ? kpi.blockedNums.slice(0, 3).map(n => `#${n}`).join(', ') + (kpi.blockedNums.length > 3 ? ` +${kpi.blockedNums.length - 3} more` : '')
    : 'none 🎉';

  const counts = useMemo(() => {
    if (!data) return { bb: 0, raven: 0 };
    const bb = data.initiatives.filter(i => i.team === 'Beaky Blinders' || i.team === 'Both').length;
    const raven = data.initiatives.filter(i => i.team === 'Raven' || i.team === 'Both').length;
    return { bb, raven };
  }, [data]);

  if (loading) {
    return (
      <div style={{ background: C.bg, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: C.muted, fontSize: 14 }}>Loading dashboard…</div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div style={{ background: C.bg, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12 }}>
        <div style={{ color: C.red, fontSize: 16, fontWeight: 600 }}>Failed to load dashboard</div>
        <div style={{ color: C.muted, fontSize: 13 }}>{error}</div>
        <button onClick={refetch} style={{ background: C.green, color: '#000', border: 'none', padding: '8px 20px', borderRadius: 8, cursor: 'pointer', fontWeight: 600, marginTop: 8 }}>Retry</button>
      </div>
    );
  }

  return (
    <div style={{ background: C.bg, minHeight: '100vh', color: C.text, fontFamily: "Inter, 'Segoe UI', system-ui, sans-serif" }}>
      {/* ── header ── */}
      <div style={{ borderBottom: '1px solid rgba(255,255,255,0.07)', padding: '18px 32px 14px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, letterSpacing: '-0.02em' }}>Unify Engineering</h1>
            <div style={{ fontSize: 12, color: C.muted, marginTop: 4 }}>
              Snapshot {data.snapshot_date}
              &nbsp;·&nbsp;{data.initiatives.length} issue{data.initiatives.length !== 1 ? 's' : ''} across 2 boards
              &nbsp;·&nbsp;Beaky Blinders {counts.bb}
              &nbsp;·&nbsp;Raven {counts.raven}
              &nbsp;·&nbsp;{data.bugs.length} bug{data.bugs.length !== 1 ? 's' : ''}
              &nbsp;·&nbsp;{data.support.length} support
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <span style={{ fontSize: 11, color: C.muted }}>Team:</span>
            <TeamChip label="All" active={team === 'all'} onClick={() => setTeam('all')} />
            <TeamChip label="Beaky Blinders — ENT 1" active={team === 'Beaky Blinders'} onClick={() => setTeam('Beaky Blinders')} />
            <TeamChip label="Team Raven — ENT 2" active={team === 'Raven'} onClick={() => setTeam('Raven')} />
          </div>
        </div>
      </div>

      <div style={{ padding: '24px 32px' }}>
        {/* ── % Delivered info banner ── */}
        <div style={{ display: 'inline-block', background: 'rgba(93,212,168,0.12)', border: '1px solid rgba(93,212,168,0.3)', borderRadius: 8, padding: '5px 14px', marginBottom: 20, fontSize: 12, color: C.green, fontWeight: 600 }}>
          One number per issue: <strong>% Delivered</strong>
        </div>

        {/* ── KPI row ── */}
        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 16 }}>
          <KpiCard label="Blocked"   value={kpi.blocked} sub={blockedSub}               color={C.red}    />
          <KpiCard label="On Track"  value="—"           sub="on track with due date"    color={C.green}  />
          <KpiCard label="At Risk"   value="—"           sub="may miss target date"      color={C.yellow} />
          <KpiCard label="Off Track" value="—"           sub="needs intervention"        color={C.red}    />
        </div>

        {/* ── shipped mini-stat ── */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: C.muted, marginBottom: 4 }}>Shipped This Week</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: C.text, lineHeight: 1 }}>{kpi.shippedWk}</div>
          <div style={{ fontSize: 11, color: C.muted, marginTop: 3 }}>
            {kpi.shippedWk === 1 ? 'sub-issue merged this week' : 'sub-issues merged this week'}
          </div>
        </div>

        {/* ── tabs ── */}
        <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid rgba(255,255,255,0.08)', marginBottom: 24, overflowX: 'auto' }}>
          <TabBtn id="overview"  label="Overview"                                                        active={tab === 'overview'}  onClick={() => setTab('overview')} />
          <TabBtn id="trends"    label="Trends"                                                          active={tab === 'trends'}    onClick={() => setTab('trends')} />
          <TabBtn id="blockers"  label={kpi.blocked > 0 ? `Blockers (${kpi.blocked})` : 'Blockers'}     active={tab === 'blockers'}  onClick={() => setTab('blockers')} />
          <TabBtn id="bugs"      label={`Bugs (${data.bugs.length})`}                                    active={tab === 'bugs'}      onClick={() => setTab('bugs')} />
          <TabBtn id="support"   label={`Support (${data.support.length})`}                              active={tab === 'support'}   onClick={() => setTab('support')} />
        </div>

        {/* ── tab content ── */}
        {tab === 'overview' && (
          <>
            <IssueTrackerTab initiatives={vis} shipped={data.shipped} statusLog={data.status_log} />
            <div style={{ marginTop: 32 }}>
              <RoadmapTab initiatives={vis} />
            </div>
          </>
        )}
        {tab === 'trends'   && <TrendsTab shipped={data.shipped} history={data.history} statusLog={data.status_log} cycleData={data.cycle_data} initiatives={vis} />}
        {tab === 'blockers' && <BlockersTab initiatives={vis} />}
        {tab === 'bugs'     && <BugsTab bugs={data.bugs} />}
        {tab === 'support'  && <SupportTab support={data.support} />}
      </div>
    </div>
  );
}
