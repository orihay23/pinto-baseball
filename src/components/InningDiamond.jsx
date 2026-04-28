// Bird's-eye field diagram for one inning. Ink-minimal: thin strokes, no fills.

const COORDS = {
  P:    { x: 90,  y: 107, anchor: 'middle' },
  C:    { x: 90,  y: 163, anchor: 'middle' },
  '1B': { x: 143, y: 114, anchor: 'start'  },
  '2B': { x: 116, y: 92,  anchor: 'start'  },
  '3B': { x: 37,  y: 114, anchor: 'end'    },
  SS:   { x: 60,  y: 90,  anchor: 'end'    },
  LF:   { x: 16,  y: 42,  anchor: 'start'  },
  LC:   { x: 63,  y: 22,  anchor: 'middle' },
  RC:   { x: 117, y: 22,  anchor: 'middle' },
  RF:   { x: 164, y: 42,  anchor: 'end'    },
};

const FONT = "system-ui, sans-serif";
const MAX_CHARS = 9;

export default function InningDiamond({ inningNumber, assignment, players }) {
  const nameAt = (pos) => {
    const player = players.find((p) => assignment[p.id] === pos);
    if (!player) return null;
    const first = player.name.split(' ')[0];
    return first.length > MAX_CHARS ? first.slice(0, MAX_CHARS - 1) + '…' : first;
  };

  return (
    <svg
      viewBox="0 0 180 175"
      xmlns="http://www.w3.org/2000/svg"
      className="diamond-svg"
      aria-label={`Inning ${inningNumber} field assignments`}
    >
      {/* Inning label */}
      <text x="3" y="11" fontSize="8" fontWeight="bold" fontFamily={FONT} fill="#333">
        Inning {inningNumber}
      </text>

      {/* Foul lines — very light */}
      <line x1="90" y1="150" x2="2"   y2="2"   stroke="#ccc" strokeWidth="0.6" />
      <line x1="90" y1="150" x2="178" y2="2"   stroke="#ccc" strokeWidth="0.6" />

      {/* Outfield arc — dashed, minimal */}
      <path
        d="M 10,58 A 92,92 0 0,1 170,58"
        fill="none"
        stroke="#ccc"
        strokeWidth="0.5"
        strokeDasharray="3,2"
      />

      {/* Infield diamond */}
      <polygon
        points="90,150 138,110 90,70 42,110"
        fill="none"
        stroke="#999"
        strokeWidth="0.9"
      />

      {/* Pitcher circle */}
      <circle cx="90" cy="108" r="5" fill="none" stroke="#bbb" strokeWidth="0.6" />

      {/* Player first names */}
      {Object.entries(COORDS).map(([pos, { x, y, anchor }]) => {
        const name = nameAt(pos);
        return name ? (
          <text
            key={pos}
            x={x}
            y={y}
            textAnchor={anchor}
            fontSize="9"
            fontFamily={FONT}
            fill="#000"
          >
            {name}
          </text>
        ) : null;
      })}
    </svg>
  );
}
