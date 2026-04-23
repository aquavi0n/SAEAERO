import { useState } from 'react';
import InputForm from './components/InputForm.jsx';
import ResultsDisplay from './components/ResultsDisplay.jsx';
import { computeFullReport } from './logic/fullCalcs.js';

export default function App() {
  const [results, setResults] = useState(null);
  const [error,   setError]   = useState(null);

  function handleCalculate(airfoilId, tailId, payloadKg) {
    try {
      setResults(computeFullReport(airfoilId, tailId, payloadKg));
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
                Full aerodynamic sizing from airfoil, payload, and tail config. Max wingspan: 10 m.
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
