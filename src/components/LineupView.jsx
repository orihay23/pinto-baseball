import { ALL_POSITIONS, POSITIONS } from '../rosterAlgorithm';
import InningDiamond from './InningDiamond';

const ZONE_COLOR = {
  infield: '#dbeafe',
  outfield: '#dcfce7',
  bench: '#fef9c3',
};

const ZONE_LABEL = {
  P: 'infield',
  C: 'infield',
  '1B': 'infield',
  '2B': 'infield',
  '3B': 'infield',
  SS: 'infield',
  LF: 'outfield',
  LC: 'outfield',
  RC: 'outfield',
  RF: 'outfield',
  BENCH: 'bench',
};

function positionBg(pos) {
  return ZONE_COLOR[ZONE_LABEL[pos]] ?? '#f3f4f6';
}

export default function LineupView({ players, innings, summary, battingOrder, onBack, onRotateLeft, onRotateRight }) {
  return (
    <div className="lineup-panel">
      <div className="lineup-toolbar">
        <button className="btn-back" onClick={onBack}>
          ← Edit Players
        </button>
        <div className="rotate-controls">
          <button className="btn-rotate" onClick={onRotateLeft} title="Rotate left: last inning becomes first">
            ← Rotate
          </button>
          <button className="btn-rotate" onClick={onRotateRight} title="Rotate right: first inning becomes last">
            Rotate →
          </button>
        </div>
        <button className="btn-print" onClick={() => window.print()}>
          Print
        </button>
      </div>

      {/* ── Batting order ── */}
      {battingOrder && (
        <section className="lineup-section no-print">
          <h2>Batting Order</h2>
          <ol className="batting-order-list">
            {battingOrder.map((p) => (
              <li key={p.id} className="batting-order-item">
                {p.name}
                {p.canPlayFirst && <span className="badge-1b">1B</span>}
              </li>
            ))}
          </ol>
        </section>
      )}

      {/* ── Diamond diagrams ── */}
      <section className="lineup-section diamond-section">
        <h2>Field Assignments by Inning</h2>
        <div className="diamond-grid">
          {innings.map((inn) => (
            <InningDiamond
              key={inn.inning}
              inningNumber={inn.inning}
              assignment={inn.assignment}
              players={players}
            />
          ))}
        </div>
      </section>

      {/* ── Inning-by-inning grid ── */}
      <section className="lineup-section positions-section no-print">
        <h2>Positions by Inning</h2>
        <div className="inning-grid-wrapper">
          <table className="inning-table">
            <thead>
              <tr>
                <th className="pos-header">Position</th>
                {innings.map((inn) => (
                  <th key={inn.inning}>Inning {inn.inning}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ALL_POSITIONS.map((pos) => (
                <tr key={pos} className={ZONE_LABEL[pos] === 'infield' ? 'row-infield' : 'row-outfield'}>
                  <td className="pos-label">{pos}</td>
                  {innings.map((inn) => {
                    const player = players.find(
                      (p) => inn.assignment[p.id] === pos
                    );
                    return (
                      <td key={inn.inning} className="player-cell">
                        {player ? player.name : <span className="empty-cell">—</span>}
                      </td>
                    );
                  })}
                </tr>
              ))}
              {/* Bench rows */}
              {(() => {
                const maxBench = Math.max(
                  ...innings.map(
                    (inn) =>
                      Object.values(inn.assignment).filter((v) => v === 'BENCH').length
                  )
                );
                return Array.from({ length: maxBench }, (_, bi) => (
                  <tr key={`bench-${bi}`} className="row-bench">
                    <td className="pos-label">{bi === 0 ? 'BENCH' : ''}</td>
                    {innings.map((inn) => {
                      const benched = players.filter(
                        (p) => inn.assignment[p.id] === 'BENCH'
                      );
                      return (
                        <td key={inn.inning} className="player-cell bench-cell">
                          {benched[bi] ? benched[bi].name : ''}
                        </td>
                      );
                    })}
                  </tr>
                ));
              })()}
            </tbody>
          </table>
        </div>
      </section>

      {/* ── Player-by-inning grid ── */}
      <section className="lineup-section batting-order-section">
        <h2>Batting Order</h2>
        <div className="inning-grid-wrapper">
          <table className="inning-table player-schedule-table">
            <thead>
              <tr>
                <th className="pos-header batting-num-col">#</th>
                <th className="pos-header">Player</th>
                {innings.map((inn) => (
                  <th key={inn.inning}>Inn {inn.inning}</th>
                ))}
                <th className="no-print">Played</th>
                <th className="no-print">Bench</th>
              </tr>
            </thead>
            <tbody>
              {(battingOrder ?? players).map((p, i) => (
                <tr key={p.id}>
                  <td className="batting-num-col">{i + 1}</td>
                  <td className="pos-label player-name-cell">
                    {p.name}
                  </td>
                  {innings.map((inn) => {
                    const pos = inn.assignment[p.id] ?? '?';
                    return (
                      <td
                        key={inn.inning}
                        className="player-cell"
                        style={{ background: positionBg(pos) }}
                      >
                        {pos}
                      </td>
                    );
                  })}
                  <td className="stat-cell no-print">{summary[p.id].played}</td>
                  <td className="stat-cell bench-stat no-print">{summary[p.id].bench}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ── Position totals ── */}
      <section className="lineup-section no-print">
        <h2>Position Totals</h2>
        <div className="inning-grid-wrapper">
          <table className="inning-table">
            <thead>
              <tr>
                <th className="pos-header">Player</th>
                {ALL_POSITIONS.map((pos) => (
                  <th key={pos}>{pos}</th>
                ))}
                <th>Bench</th>
              </tr>
            </thead>
            <tbody>
              {players.map((p) => (
                <tr key={p.id}>
                  <td className="pos-label player-name-cell">
                    {p.name}
                  </td>
                  {ALL_POSITIONS.map((pos) => (
                    <td
                      key={pos}
                      className="player-cell"
                      style={{
                        background:
                          summary[p.id].positions[pos] > 0
                            ? positionBg(pos)
                            : undefined,
                        fontWeight: summary[p.id].positions[pos] > 0 ? 600 : undefined,
                      }}
                    >
                      {summary[p.id].positions[pos] || '·'}
                    </td>
                  ))}
                  <td className="stat-cell bench-stat">{summary[p.id].bench}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ── Legend ── */}
      <div className="legend">
        <span className="legend-item" style={{ background: ZONE_COLOR.infield }}>Infield</span>
        <span className="legend-item" style={{ background: ZONE_COLOR.outfield }}>Outfield</span>
        <span className="legend-item" style={{ background: ZONE_COLOR.bench }}>Bench</span>
      </div>
    </div>
  );
}
