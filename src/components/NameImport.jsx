import { useState } from 'react';

export default function NameImport({ onImport }) {
  const [text, setText] = useState('');

  const names = text
    .split('\n')
    .map((n) => n.trim())
    .filter((n) => n.length > 0);

  const handleImport = () => {
    if (names.length === 0) return;
    onImport(names);
  };

  const handleKeyDown = (e) => {
    // Allow Tab to insert spaces instead of leaving the textarea
    if (e.key === 'Tab') {
      e.preventDefault();
    }
  };

  return (
    <div className="import-panel">
      <div className="import-intro">
        <h2>Paste your roster</h2>
        <p>One player name per line. You can set 1B eligibility on the next screen.</p>
      </div>

      <textarea
        className="import-textarea"
        placeholder={"Alex\nBailey\nCameron\nDakota\n…"}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        autoFocus
        spellCheck={false}
      />

      <div className="import-footer">
        <span className={`import-count ${names.length >= 10 ? 'ok' : names.length > 0 ? 'warn' : ''}`}>
          {names.length > 0
            ? `${names.length} player${names.length !== 1 ? 's' : ''}${names.length < 10 ? ' — need at least 10' : ''}`
            : 'No names yet'}
        </span>
        <button
          className="btn-import"
          onClick={handleImport}
          disabled={names.length === 0}
        >
          Load Players →
        </button>
      </div>
    </div>
  );
}
