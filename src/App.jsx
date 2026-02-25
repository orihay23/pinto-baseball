import { useState, useCallback } from 'react';
import PlayerSetup from './components/PlayerSetup';
import LineupView from './components/LineupView';
import NameImport from './components/NameImport';
import { generateLineup, buildSummary } from './rosterAlgorithm';
import './App.css';

const DEFAULT_PLAYERS = [
  { id: '1', name: 'Alex', canPlayFirst: true },
  { id: '2', name: 'Bailey', canPlayFirst: false },
  { id: '3', name: 'Cameron', canPlayFirst: true },
  { id: '4', name: 'Dakota', canPlayFirst: false },
  { id: '5', name: 'Emery', canPlayFirst: false },
  { id: '6', name: 'Finley', canPlayFirst: true },
  { id: '7', name: 'Gray', canPlayFirst: false },
  { id: '8', name: 'Harper', canPlayFirst: false },
  { id: '9', name: 'Indigo', canPlayFirst: false },
  { id: '10', name: 'Jordan', canPlayFirst: true },
  { id: '11', name: 'Kai', canPlayFirst: false },
  { id: '12', name: 'Lane', canPlayFirst: false },
  { id: '13', name: 'Morgan', canPlayFirst: false },
];

export default function App() {
  const [players, setPlayers] = useState(DEFAULT_PLAYERS);
  const [innings, setInnings] = useState(null);
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState(null);
  const [tab, setTab] = useState('import');

  const handleImport = useCallback((names) => {
    setPlayers(names.map((name, i) => ({ id: `import-${Date.now()}-${i}`, name, canPlayFirst: false })));
    setInnings(null);
    setSummary(null);
    setError(null);
    setTab('setup');
  }, []);

  const handleGenerate = useCallback(() => {
    try {
      setError(null);
      const result = generateLineup(players);
      setInnings(result);
      setSummary(buildSummary(players, result));
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
            onBack={() => setTab('setup')}
          />
        )}
      </main>
    </div>
  );
}
