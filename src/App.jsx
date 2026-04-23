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
    <div className="min-h-screen bg-white text-gray-900 p-6 md:p-10" style={{ fontFamily: 'system-ui, sans-serif' }}>
      <div className="max-w-3xl mx-auto">
        <div className="mb-8 border-b border-gray-200 pb-5">
          <h1 className="text-2xl font-bold tracking-tight">SAE Aero Calculator</h1>
          <p className="text-sm text-gray-500 mt-1">
            Full aerodynamic sizing from airfoil, payload, and tail configuration.
            Max wingspan: 10 m.
          </p>
        </div>

        {results === null ? (
          <>
            {error && (
              <div className="mb-5 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded">
                Error: {error}
              </div>
            )}
            <InputForm onCalculate={handleCalculate} />
          </>
        ) : (
          <ResultsDisplay results={results} onBack={() => setResults(null)} />
        )}
      </div>
    </div>
  );
}
