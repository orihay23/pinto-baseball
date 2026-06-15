import { useState, useCallback } from 'react';
import PlayerSetup from './components/PlayerSetup';
import LineupView from './components/LineupView';
import NameImport from './components/NameImport';
import { generateLineup, buildSummary, generateBattingOrder } from './rosterAlgorithm';
import './App.css';

const DEFAULT_PLAYERS = [
  { id: '1',  name: 'Alex',    cannotPlayFirst: false, cannotPlayC: false },
  { id: '2',  name: 'Bailey',  cannotPlayFirst: true,  cannotPlayC: false },
  { id: '3',  name: 'Cameron', cannotPlayFirst: false, cannotPlayC: false },
  { id: '4',  name: 'Dakota',  cannotPlayFirst: true,  cannotPlayC: false },
  { id: '5',  name: 'Emery',   cannotPlayFirst: true,  cannotPlayC: false },
  { id: '6',  name: 'Finley',  cannotPlayFirst: false, cannotPlayC: false },
  { id: '7',  name: 'Gray',    cannotPlayFirst: true,  cannotPlayC: false },
  { id: '8',  name: 'Harper',  cannotPlayFirst: true,  cannotPlayC: false },
  { id: '9',  name: 'Indigo',  cannotPlayFirst: true,  cannotPlayC: false },
  { id: '10', name: 'Jordan',  cannotPlayFirst: false, cannotPlayC: false },
  { id: '11', name: 'Kai',     cannotPlayFirst: true,  cannotPlayC: false },
  { id: '12', name: 'Lane',    cannotPlayFirst: true,  cannotPlayC: false },
  { id: '13', name: 'Morgan',  cannotPlayFirst: true,  cannotPlayC: false },
];

export default function App() {
  const [players, setPlayers] = useState(DEFAULT_PLAYERS);
  const [innings, setInnings] = useState(null);
  const [summary, setSummary] = useState(null);
  const [battingOrder, setBattingOrder] = useState(null);
  const [error, setError] = useState(null);
  const [tab, setTab] = useState('import');

  const handleImport = useCallback((names) => {
    setPlayers(names.map((name, i) => ({ id: `import-${Date.now()}-${i}`, name, cannotPlayFirst: false, cannotPlayC: false, benchFirst: false })));
    setInnings(null);
    setSummary(null);
    setBattingOrder(null);
    setError(null);
    setTab('setup');
  }, []);

  const handleRotate = useCallback((direction) => {
    setInnings((prev) => {
      if (!prev) return prev;
      const assignments = prev.map((inn) => inn.assignment);
      const rotated = direction === 'left'
        ? [...assignments.slice(1), assignments[0]]
        : [assignments[assignments.length - 1], ...assignments.slice(0, -1)];
      const next = prev.map((inn, i) => ({ ...inn, assignment: rotated[i] }));
      setSummary(buildSummary(players, next));
      return next;
    });
  }, [players]);

  const handleGenerate = useCallback(() => {
    try {
      setError(null);
      const result = generateLineup(players);
      setInnings(result);
      setSummary(buildSummary(players, result));
      setBattingOrder(generateBattingOrder(players));
      setTab('lineup');
    } catch (e) {
      setError(e.message);
    }
  }, [players]);

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-content">
          <span className="header-icon">⚾</span>
          <div>
            <h1>Baseball Roster Generator</h1>
            <p className="header-sub">6 innings · 10 positions · fair playing time</p>
          </div>
        </div>
        <div className="tab-bar">
          <button
            className={`tab-btn ${tab === 'import' ? 'active' : ''}`}
            onClick={() => setTab('import')}
          >
            Paste Names
          </button>
          <button
            className={`tab-btn ${tab === 'setup' ? 'active' : ''}`}
            onClick={() => setTab('setup')}
          >
            Players
          </button>
          <button
            className={`tab-btn ${tab === 'lineup' ? 'active' : ''}`}
            onClick={() => setTab('lineup')}
            disabled={!innings}
          >
            Lineup
          </button>
        </div>
      </header>

      <main className="app-main">
        {error && <div className="error-banner">{error}</div>}

        {tab === 'import' && (
          <NameImport onImport={handleImport} />
        )}

        {tab === 'setup' && (
          <PlayerSetup
            players={players}
            setPlayers={setPlayers}
            onGenerate={handleGenerate}
          />
        )}

        {tab === 'lineup' && innings && (
          <LineupView
            players={players}
            innings={innings}
            summary={summary}
            battingOrder={battingOrder}
            onBack={() => setTab('setup')}
            onRotateLeft={() => handleRotate('left')}
            onRotateRight={() => handleRotate('right')}
          />
        )}
      </main>
    </div>
  );
}
