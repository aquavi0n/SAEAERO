import { useState } from 'react';
import InputForm from './components/InputForm.jsx';
import ResultsDisplay from './components/ResultsDisplay.jsx';
import { computeFullReport } from './logic/fullCalcs.js';

const ACCESS_CODE = '4694270727';
const SESSION_KEY = 'sae_unlocked_until';
const SESSION_DURATION = 60 * 60 * 1000; // 1 hour

function isSessionValid() {
  const expiry = localStorage.getItem(SESSION_KEY);
  return expiry && Date.now() < Number(expiry);
}

function saveSession() {
  localStorage.setItem(SESSION_KEY, Date.now() + SESSION_DURATION);
}

function LockScreen({ onUnlock }) {
  const [input, setInput] = useState('');
  const [failed, setFailed] = useState(false);

  function handleSubmit(e) {
    e.preventDefault();
    if (input === ACCESS_CODE) {
      saveSession();
      onUnlock();
    } else {
      setFailed(true);
      setInput('');
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex flex-col items-center justify-center px-4" style={{ fontFamily: 'system-ui, sans-serif' }}>
      <div className="w-full max-w-xs">
        <h1 className="text-2xl font-bold text-white tracking-tight mb-2">SAE Aero Calculator</h1>
        <p className="text-sm text-gray-400 mb-8">Enter access code to continue.</p>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input
            type="password"
            value={input}
            onChange={e => { setInput(e.target.value); setFailed(false); }}
            placeholder="Access code"
            autoFocus
            className="w-full bg-gray-800 border border-gray-700 text-gray-100 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
          />
          {failed && <p className="text-red-400 text-sm">Incorrect access code.</p>}
          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-medium rounded px-3 py-2 text-sm transition-colors"
          >
            Unlock
          </button>
        </form>
      </div>
    </div>
  );
}

export default function App() {
  const [unlocked, setUnlocked] = useState(isSessionValid);
  const [results, setResults] = useState(null);
  const [error,   setError]   = useState(null);

  if (!unlocked) return <LockScreen onUnlock={() => setUnlocked(true)} />;

  function handleCalculate(airfoilId, wingConfigId, tailId, wingspanM) {
    try {
      setResults(computeFullReport(airfoilId, wingConfigId, tailId, wingspanM));
      setError(null);
    } catch (e) {
      setError(e.message);
      setResults(null);
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100" style={{ fontFamily: 'system-ui, sans-serif' }}>
      {results === null ? (
        /* ── Input screen: vertically + horizontally centered ── */
        <div className="min-h-screen flex flex-col items-center justify-center px-4">
          <div className="w-full max-w-md">
            <div className="mb-8">
              <h1 className="text-2xl font-bold text-white tracking-tight">SAE Aero Calculator</h1>
              <p className="text-sm text-gray-400 mt-1">
                Set your wingspan — get payload capacity + full aircraft sizing. 15 ft combined span limit.
              </p>
            </div>

            {error && (
              <div className="mb-5 p-3 bg-red-950 border border-red-800 text-red-300 text-sm rounded">
                Error: {error}
              </div>
            )}

            <InputForm onCalculate={handleCalculate} />
          </div>
        </div>
      ) : (
        /* ── Results screen: centered column ── */
        <div className="flex flex-col items-center px-4 py-10">
          <div className="w-full max-w-3xl">
            <ResultsDisplay results={results} onBack={() => setResults(null)} />
          </div>
        </div>
      )}
    </div>
  );
}
