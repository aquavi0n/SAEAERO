import { useState } from 'react';
import { AIRFOILS } from '../data/airfoils.js';
import { TAIL_CONFIGS } from '../data/tailConfigs.js';

const inputCls = 'w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-sm text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent';
const labelCls = 'block text-sm font-semibold text-gray-200 mb-1';

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

      {/* Payload */}
      <div className="mb-5">
        <label className={labelCls}>Payload Mass (kg)</label>
        <input
          type="number" min="0.1" max="100" step="0.1"
          value={payload} onChange={e => setPayload(e.target.value)}
          className={inputCls} placeholder="e.g. 2.5"
        />
        <p className="text-xs text-gray-500 mt-1">
          Mass of the cargo/payload in kilograms. Aircraft is sized around this.
        </p>
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
        Max wingspan 10 m · Stall target 6.0 m/s · AR target 7.0
      </p>
    </form>
  );
}
