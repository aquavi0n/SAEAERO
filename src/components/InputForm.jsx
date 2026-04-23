import { useState } from 'react';
import { AIRFOILS } from '../data/airfoils.js';
import { TAIL_CONFIGS } from '../data/tailConfigs.js';

export default function InputForm({ onCalculate }) {
  const [airfoilId, setAirfoilId] = useState('NACA_4412');
  const [tailId,    setTailId]    = useState('CONVENTIONAL');
  const [payload,   setPayload]   = useState('1.0');

  const selAirfoil = AIRFOILS.find(a => a.id === airfoilId);
  const selTail    = TAIL_CONFIGS.find(t => t.id === tailId);

  function handleSubmit(e) {
    e.preventDefault();
    const kg = parseFloat(payload);
    if (!kg || kg <= 0) return;
    onCalculate(airfoilId, tailId, kg);
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-lg">
      {/* Airfoil */}
      <div className="mb-6">
        <label className="block text-sm font-semibold text-gray-800 mb-1">
          Wing Airfoil
        </label>
        <select
          value={airfoilId}
          onChange={e => setAirfoilId(e.target.value)}
          className="w-full border border-gray-300 rounded px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {AIRFOILS.map(a => (
            <option key={a.id} value={a.id}>
              {a.name} — CL_max {a.CL_max}
            </option>
          ))}
        </select>
        {selAirfoil && (
          <p className="text-xs text-gray-500 mt-1">{selAirfoil.constructionNote}</p>
        )}
        {selAirfoil?.warningText && (
          <p className="text-xs text-orange-600 mt-1 font-medium">⚠ {selAirfoil.warningText}</p>
        )}
      </div>

      {/* Payload */}
      <div className="mb-6">
        <label className="block text-sm font-semibold text-gray-800 mb-1">
          Payload Mass (kg)
        </label>
        <input
          type="number"
          min="0.1"
          max="100"
          step="0.1"
          value={payload}
          onChange={e => setPayload(e.target.value)}
          className="w-full border border-gray-300 rounded px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="e.g. 2.5"
        />
        <p className="text-xs text-gray-500 mt-1">
          Mass of the cargo/payload to carry, in kilograms. Aircraft will be sized around this.
        </p>
      </div>

      {/* Tail type */}
      <div className="mb-8">
        <label className="block text-sm font-semibold text-gray-800 mb-1">
          Tail Configuration
        </label>
        <select
          value={tailId}
          onChange={e => setTailId(e.target.value)}
          className="w-full border border-gray-300 rounded px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {TAIL_CONFIGS.map(t => (
            <option key={t.id} value={t.id}>{t.name}</option>
          ))}
        </select>
        {selTail?.warnings.length > 0 && (
          <p className="text-xs text-orange-600 mt-1 font-medium">
            ⚠ {selTail.warnings[0]}
          </p>
        )}
      </div>

      <button
        type="submit"
        className="w-full bg-blue-600 text-white font-semibold py-2.5 rounded text-sm hover:bg-blue-700 active:bg-blue-800 transition-colors"
      >
        Calculate Everything
      </button>

      <p className="text-xs text-gray-400 mt-3 text-center">
        Max wingspan constraint: 10.0 m · Stall speed target: 6.0 m/s · Aspect ratio target: 7.0
      </p>
    </form>
  );
}
