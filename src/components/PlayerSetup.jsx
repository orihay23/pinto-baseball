import { useState } from 'react';

let nextId = 100;

export default function PlayerSetup({ players, setPlayers, onGenerate }) {
  const [newName, setNewName] = useState('');

  const addPlayer = () => {
    const name = newName.trim();
    if (!name) return;
    setPlayers((prev) => [
      ...prev,
      { id: String(nextId++), name, canPlayFirst: false },
    ]);
    setNewName('');
  };

  const removePlayer = (id) => {
    setPlayers((prev) => prev.filter((p) => p.id !== id));
  };

  const toggleFirst = (id) => {
    setPlayers((prev) =>
      prev.map((p) =>
        p.id === id ? { ...p, canPlayFirst: !p.canPlayFirst } : p
      )
    );
  };

  const updateName = (id, name) => {
    setPlayers((prev) =>
      prev.map((p) => (p.id === id ? { ...p, name } : p))
    );
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') addPlayer();
  };

  const onField = players.length >= 10;
  const canGenerate = players.length >= 10;

  return (
    <div className="setup-panel">
      <div className="setup-info">
        <span className={`player-count ${canGenerate ? 'ok' : 'warn'}`}>
          {players.length} players
        </span>
        <span className="player-count-sub">
          {players.length >= 10
            ? `${players.length - 10} sub${players.length - 10 !== 1 ? 's' : ''} per inning`
            : `Need at least 10`}
        </span>
        <span className="first-count">
          {players.filter((p) => p.canPlayFirst).length} can play 1B
        </span>
      </div>

      <div className="add-player-row">
        <input
          className="player-input"
          placeholder="Player name…"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <button className="btn-add" onClick={addPlayer} disabled={!newName.trim()}>
          Add Player
        </button>
      </div>

      <div className="player-list-header">
        <span>Name</span>
        <span className="col-1b">Can play 1B</span>
        <span className="col-remove"></span>
      </div>

      <ul className="player-list">
        {players.map((p, i) => (
          <li key={p.id} className="player-row">
            <span className="player-num">{i + 1}</span>
            <input
              className="player-name-input"
              value={p.name}
              onChange={(e) => updateName(p.id, e.target.value)}
            />
            <label className="toggle-1b">
              <input
                type="checkbox"
                checked={p.canPlayFirst}
                onChange={() => toggleFirst(p.id)}
              />
              <span className="toggle-track">
                <span className="toggle-thumb" />
              </span>
            </label>
            <button
              className="btn-remove"
              onClick={() => removePlayer(p.id)}
              title="Remove player"
            >
              ✕
            </button>
          </li>
        ))}
      </ul>

      <div className="generate-row">
        <button
          className="btn-generate"
          onClick={onGenerate}
          disabled={!canGenerate}
        >
          Generate Lineup
        </button>
        {!canGenerate && (
          <span className="generate-hint">Add at least 10 players to generate a lineup.</span>
        )}
      </div>
    </div>
  );
}
