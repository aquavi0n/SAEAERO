import { useState } from 'react';
import { AIRFOILS } from '../data/airfoils.js';
import { TAIL_CONFIGS } from '../data/tailConfigs.js';
import { WING_CONFIGS } from '../data/wingConfigs.js';

const inputCls = 'w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-sm text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent';
const labelCls = 'block text-sm font-semibold text-gray-200 mb-1';

// 15 ft combined span rule: combined = span × factor
const MAX_COMBINED_M = 4.572; // 15 ft in metres
const COMBINED_FACTOR = { MONOPLANE: 1.0, BIPLANE: 2.0, SESQUIPLANE: 1.6 };

function maxSpanForConfig(configId) {
  return MAX_COMBINED_M / (COMBINED_FACTOR[configId] ?? 1.0);
}

export default function InputForm({ onCalculate }) {
  const [airfoilId,    setAirfoilId]    = useState('NACA_4412');
  const [wingConfigId, setWingConfigId] = useState('MONOPLANE');
  const [tailId,       setTailId]       = useState('CONVENTIONAL');
  const [wingspan,     setWingspan]     = useState('3.00');

  const selAirfoil    = AIRFOILS.find(a => a.id === airfoilId);
  const selWingConfig = WING_CONFIGS.find(w => w.id === wingConfigId);
  const selTail       = TAIL_CONFIGS.find(t => t.id === tailId);

  const maxSpan    = maxSpanForConfig(wingConfigId);
  const spanVal    = parseFloat(wingspan) || 0;
  const overLimit  = spanVal > maxSpan + 0.001;
  const combinedFt = ((spanVal * (COMBINED_FACTOR[wingConfigId] ?? 1.0)) / 0.3048).toFixed(2);

  function handleSubmit(e) {
    e.preventDefault();
    const m = parseFloat(wingspan);
    if (!m || m <= 0) return;
    onCalculate(airfoilId, wingConfigId, tailId, m);
  }

  return (
    <form onSubmit={handleSubmit}>
      {/* Airfoil */}
      <div className="mb-5">
        <label className={labelCls}>Wing Airfoil</label>
        <select value={airfoilId} onChange={e => setAirfoilId(e.target.value)} className={inputCls}>
          {AIRFOILS.map(a => (
            <option key={a.id} value={a.id}>{a.name} — CL_max {a.CL_max}</option>
          ))}
        </select>
        {selAirfoil && (
          <p className="text-xs text-gray-500 mt-1">{selAirfoil.constructionNote}</p>
        )}
        {selAirfoil?.warningText && (
          <p className="text-xs text-orange-400 mt-1 font-medium">⚠ {selAirfoil.warningText}</p>
        )}
      </div>

      {/* Wing Configuration */}
      <div className="mb-5">
        <label className={labelCls}>Wing Configuration</label>
        <select value={wingConfigId} onChange={e => setWingConfigId(e.target.value)} className={inputCls}>
          {WING_CONFIGS.map(w => (
            <option key={w.id} value={w.id}>{w.name}</option>
          ))}
        </select>
        {selWingConfig && (
          <p className="text-xs text-gray-500 mt-1">{selWingConfig.note}</p>
        )}
      </div>

      {/* Wingspan */}
      <div className="mb-5">
        <label className={labelCls}>
          Wingspan — main wing span (m)
        </label>
        <input
          type="number" min="0.1" max={maxSpan.toFixed(2)} step="0.01"
          value={wingspan} onChange={e => setWingspan(e.target.value)}
          className={`${inputCls} ${overLimit ? 'border-orange-500 focus:ring-orange-500' : ''}`}
          placeholder="e.g. 3.00"
        />
        <div className="mt-1 space-y-0.5">
          <p className="text-xs text-gray-500">
            15 ft combined limit → max <span className="text-gray-300 font-mono">{maxSpan.toFixed(2)} m</span> for {selWingConfig?.name ?? wingConfigId}
            {COMBINED_FACTOR[wingConfigId] > 1 && (
              <span className="text-gray-600"> (×{COMBINED_FACTOR[wingConfigId]} combined)</span>
            )}
          </p>
          {spanVal > 0 && (
            <p className="text-xs text-gray-600 font-mono">
              combined = {(spanVal * (COMBINED_FACTOR[wingConfigId] ?? 1.0)).toFixed(2)} m = {combinedFt} ft
            </p>
          )}
          {overLimit && (
            <p className="text-xs text-orange-400">Over limit — will be capped to {maxSpan.toFixed(2)} m.</p>
          )}
        </div>
      </div>

      {/* Tail */}
      <div className="mb-8">
        <label className={labelCls}>Tail Configuration</label>
        <select value={tailId} onChange={e => setTailId(e.target.value)} className={inputCls}>
          {TAIL_CONFIGS.map(t => (
            <option key={t.id} value={t.id}>{t.name}</option>
          ))}
        </select>
        {selTail?.warnings.length > 0 && (
          <p className="text-xs text-orange-400 mt-1 font-medium">⚠ {selTail.warnings[0]}</p>
        )}
      </div>

      <button
        type="submit"
        className="w-full bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-semibold py-2.5 rounded text-sm transition-colors"
      >
        Calculate Everything
      </button>

      <p className="text-xs text-gray-600 mt-3 text-center">
        15 ft (4.572 m) combined span · Stall target 6.0 m/s · AR 7.0
      </p>
    </form>
  );
}
