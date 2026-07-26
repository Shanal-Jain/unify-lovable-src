import React from 'react';
import { Initiative } from '../types';
import { C, blockerInclude, whyBlocked, waitingOn, stageInfo } from '../utils';

const GH = 'https://github.com/boostlingo/bl-platform';

const STAGE_ORDER: Record<string, number> = {
  'human-approved': 0, 'polly-approved': 1, 'pr-open': 2, 'in-progress': 3, 'no-pr': 4,
};

export function BlockersTab({ initiatives }: { initiatives: Initiative[] }) {
  const rows: { i: Initiative; s: import('../types').SubIssue }[] = [];
  initiatives.forEach(i =>
    i.subIssues.forEach(s => {
      if (blockerInclude(s)) rows.push({ i, s });
    })
  );
  rows.sort((a, b) => (STAGE_ORDER[a.s.stage] ?? 9) - (STAGE_ORDER[b.s.stage] ?? 9));

  const ageColor = (d: number) => d >= 10 ? C.red : d >= 5 ? C.yellow : 'rgba(255,255,255,0.55)';

  return (
    <div>
      <div style={{ fontSize: 11, color: C.muted, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>
        Blockers — cause and owner
      </div>
      {!rows.length ? (
        <div style={{ color: C.muted, fontSize: 14, padding: '16px 0' }}>Nothing blocked. 🎉</div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ color: C.muted, fontSize: 10, fontWeight: 600, textTransform: 'uppercase', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                <th style={{ textAlign: 'left', padding: '8px 10px', width: 220 }}>Sub-issue</th>
                <th style={{ textAlign: 'left', padding: '8px 10px', width: 160 }}>Issue</th>
                <th style={{ textAlign: 'left', padding: '8px 10px', width: 100 }}>Stage</th>
                <th style={{ textAlign: 'left', padding: '8px 10px', width: 60 }}>Age</th>
                <th style={{ textAlign: 'left', padding: '8px 10px' }}>Why blocked</th>
                <th style={{ textAlign: 'left', padding: '8px 10px', width: 150 }}>Waiting on</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ i, s }) => {
                const info = stageInfo(s);
                const age = s.ageDays ?? 0;
                const ageWarn = age >= 10 ? ' ⚠' : '';
                return (
                  <tr key={s.number} style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                    <td style={{ padding: '8px 10px' }}>
                      <a href={`${GH}/issues/${s.number}`} target="_blank" rel="noreferrer"
                         style={{ color: C.muted, textDecoration: 'none', marginRight: 6 }}>#{s.number}</a>
                      <span style={{ color: C.text }}>{s.title}</span>
                    </td>
                    <td style={{ padding: '8px 10px', fontSize: 11, color: C.muted }}>
                      {i.title.length > 28 ? i.title.slice(0, 26) + '…' : i.title}
                    </td>
                    <td style={{ padding: '8px 10px' }}>
                      <span style={{
                        fontSize: 10, fontWeight: 600, padding: '2px 7px', borderRadius: 10,
                        background: info.color + '22', color: info.color, border: `1px solid ${info.color}44`,
                      }} title={info.detail}>
                        {info.label}
                      </span>
                    </td>
                    <td style={{ padding: '8px 10px' }}>
                      {age < 0 ? (
                        <span style={{ color: C.faint }}>—</span>
                      ) : (
                        <span style={{ fontFamily: 'monospace', color: ageColor(age), fontWeight: age >= 5 ? 600 : 400 }}>
                          {age}d{ageWarn}
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '8px 10px', color: 'rgba(255,255,255,0.7)' }}>
                      {whyBlocked(s)}
                    </td>
                    <td style={{ padding: '8px 10px', color: C.yellow, fontWeight: 500, fontSize: 12 }}>
                      {waitingOn(s)}
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
}
