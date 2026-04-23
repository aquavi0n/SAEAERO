import React from 'react';
import { AIRFOILS } from '../data/airfoils.js';
import { TAIL_CONFIGS } from '../data/tailConfigs.js';
import { WING_CONFIGS } from '../data/wingConfigs.js';
import { MOTORS } from '../data/motors.js';
import { MATERIALS } from '../data/materials.js';

// ── Small primitives ─────────────────────────────────────────────────────────

function Label({ children }) {
  return <div className="text-xs font-medium text-gray-400 mb-1.5">{children}</div>;
}

function SectionHeader({ children }) {
  return (
    <div className="px-4 pt-5 pb-2 flex items-center gap-2">
      <span className="text-xs font-bold text-blue-400 uppercase tracking-widest">{children}</span>
      <div className="flex-1 h-px bg-gray-800" />
    </div>
  );
}

function Select({ value, options, onChange, getValue, getLabel }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full bg-gray-900 border border-gray-700 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 transition-colors"
    >
      {options.map((opt) => (
        <option key={getValue(opt)} value={getValue(opt)}>{getLabel(opt)}</option>
      ))}
    </select>
  );
}

function NumberStepper({ value, onChange, min, max, step = 0.1, unit, format }) {
  const display = format ? format(value) : value.toFixed(1);
  function adjust(delta) {
    const next = Math.max(min, Math.min(max, parseFloat((value + delta).toFixed(4))));
    onChange(next);
  }
  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => adjust(-step)}
        className="w-8 h-8 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 font-bold text-lg flex items-center justify-center transition-colors select-none"
      >−</button>
      <div className="flex-1 text-center">
        <span className="text-white font-semibold text-lg">{display}</span>
        {unit && <span className="text-gray-500 text-sm ml-1">{unit}</span>}
      </div>
      <button
        onClick={() => adjust(step)}
        className="w-8 h-8 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 font-bold text-lg flex items-center justify-center transition-colors select-none"
      >+</button>
    </div>
  );
}

// ── Wing type card picker ─────────────────────────────────────────────────────

function WingCard({ config, selected, onClick }) {
  const icons = { MONOPLANE: '▬', BIPLANE: '≡', SESQUIPLANE: '⊟' };
  return (
    <button
      onClick={onClick}
      className={`flex-1 py-2.5 px-2 rounded-lg border text-xs font-medium transition-all flex flex-col items-center gap-1 ${
        selected
          ? 'bg-blue-600/20 border-blue-500 text-blue-300'
          : 'bg-gray-900 border-gray-700 text-gray-400 hover:border-gray-500 hover:text-gray-300'
      }`}
    >
      <span className="text-base">{icons[config.id]}</span>
      <span>{config.name.split(' ')[0]}</span>
    </button>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function ConfigPanel({ cfg, set }) {
  const selectedMotor = MOTORS.find((m) => m.id === cfg.motorId);
  const selectedAirfoil = AIRFOILS.find((a) => a.id === cfg.airfoilId);
  const isCustomMotor = cfg.motorId === 'CUSTOM';

  return (
    <div className="pb-8">

      {/* ── Target ── */}
      <SectionHeader>Mission</SectionHeader>
      <div className="px-4 space-y-4">
        <div>
          <Label>Target payload</Label>
          <NumberStepper
            value={cfg.payloadKg}
            onChange={(v) => set('payloadKg', v)}
            min={0.05}
            max={5.0}
            step={0.05}
            unit="kg"
            format={(v) => v.toFixed(2)}
          />
          <div className="text-center text-xs text-gray-600 mt-1">{(cfg.payloadKg * 1000).toFixed(0)} g</div>
        </div>
        <div>
          <Label>Max wingspan (SAE constraint)</Label>
          <NumberStepper
            value={cfg.wingspan}
            onChange={(v) => set('wingspan', v)}
            min={0.5}
            max={3.0}
            step={0.05}
            unit="m"
            format={(v) => v.toFixed(2)}
          />
        </div>
      </div>

      {/* ── Wing ── */}
      <SectionHeader>Wing</SectionHeader>
      <div className="px-4 space-y-4">
        <div>
          <Label>Wing type</Label>
          <div className="flex gap-2">
            {WING_CONFIGS.map((wc) => (
              <WingCard
                key={wc.id}
                config={wc}
                selected={cfg.wingConfigId === wc.id}
                onClick={() => set('wingConfigId', wc.id)}
              />
            ))}
          </div>
          <div className="mt-1.5 text-xs text-gray-600 leading-snug">
            {WING_CONFIGS.find((w) => w.id === cfg.wingConfigId)?.note}
          </div>
        </div>
        <div>
          <Label>Airfoil</Label>
          <Select
            value={cfg.airfoilId}
            options={AIRFOILS}
            onChange={(v) => set('airfoilId', v)}
            getValue={(o) => o.id}
            getLabel={(o) => o.name}
          />
          {selectedAirfoil && (
            <div className="mt-1.5 flex gap-3 text-xs text-gray-500">
              <span>CL_max: <span className="text-gray-300 font-medium">{selectedAirfoil.CL_max}</span></span>
              <span>Stall: <span className="text-gray-300 font-medium">{selectedAirfoil.stallAngle}°</span></span>
              {selectedAirfoil.warningText && (
                <span className="text-yellow-600 truncate" title={selectedAirfoil.warningText}>⚠ {selectedAirfoil.warningText.split('.')[0]}</span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Tail ── */}
      <SectionHeader>Tail</SectionHeader>
      <div className="px-4">
        <Select
          value={cfg.tailConfigId}
          options={TAIL_CONFIGS}
          onChange={(v) => set('tailConfigId', v)}
          getValue={(o) => o.id}
          getLabel={(o) => o.name}
        />
      </div>

      {/* ── Motor ── */}
      <SectionHeader>Motor</SectionHeader>
      <div className="px-4 space-y-3">
        <Select
          value={cfg.motorId}
          options={MOTORS}
          onChange={(v) => set('motorId', v)}
          getValue={(o) => o.id}
          getLabel={(o) => o.name}
        />
        {!isCustomMotor && selectedMotor && (
          <div className="bg-gray-900 rounded-lg px-3 py-2.5 text-xs space-y-1">
            <div className="flex justify-between">
              <span className="text-gray-500">Max thrust</span>
              <span className="text-white font-medium">{selectedMotor.maxThrustG} g</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Motor weight</span>
              <span className="text-white font-medium">{selectedMotor.weightG} g</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Prop</span>
              <span className="text-white font-medium">{selectedMotor.recommendedPropIn}"</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">KV</span>
              <span className="text-white font-medium">{selectedMotor.kv}</span>
            </div>
          </div>
        )}
        {isCustomMotor && (
          <div className="space-y-2">
            <div>
              <Label>Max thrust (g)</Label>
              <input
                type="number"
                value={cfg.manualThrustG}
                min={0}
                max={5000}
                onChange={(e) => set('manualThrustG', parseFloat(e.target.value) || 0)}
                className="w-full bg-gray-900 border border-gray-700 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <Label>Motor weight (g)</Label>
              <input
                type="number"
                value={cfg.manualMotorWeightG}
                min={0}
                max={500}
                onChange={(e) => set('manualMotorWeightG', parseFloat(e.target.value) || 0)}
                className="w-full bg-gray-900 border border-gray-700 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>
        )}
      </div>

      {/* ── Battery ── */}
      <SectionHeader>Battery</SectionHeader>
      <div className="px-4 flex gap-2">
        <div className="flex-1">
          <Label>Cell count</Label>
          <Select
            value={cfg.batteryS}
            options={[2, 3, 4, 5, 6].map((s) => ({ id: s }))}
            onChange={(v) => set('batteryS', parseInt(v))}
            getValue={(o) => o.id}
            getLabel={(o) => `${o.id}S LiPo`}
          />
        </div>
        <div className="flex-1">
          <Label>Capacity</Label>
          <Select
            value={cfg.batteryCapacityMAh}
            options={[1000, 1300, 1500, 2200, 3000, 4000, 5000].map((c) => ({ id: c }))}
            onChange={(v) => set('batteryCapacityMAh', parseInt(v))}
            getValue={(o) => o.id}
            getLabel={(o) => `${o.id} mAh`}
          />
        </div>
      </div>

      {/* ── Build material ── */}
      <SectionHeader>Build Material</SectionHeader>
      <div className="px-4 space-y-2">
        <Select
          value={cfg.materialId}
          options={MATERIALS}
          onChange={(v) => set('materialId', v)}
          getValue={(o) => o.id}
          getLabel={(o) => o.name}
        />
        {(() => {
          const mat = MATERIALS.find((m) => m.id === cfg.materialId);
          return mat ? (
            <div className="bg-gray-900 rounded-lg px-3 py-2.5 text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-gray-500">Surface density</span>
                <span className="text-white font-medium">{mat.densityKgM2} kg/m²</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Build difficulty</span>
                <span className={`font-medium ${mat.buildDifficulty === 'easy' ? 'text-green-400' : mat.buildDifficulty === 'medium' ? 'text-yellow-400' : 'text-red-400'}`}>
                  {mat.buildDifficulty}
                </span>
              </div>
              <div className="text-gray-600 leading-snug mt-1">{mat.note}</div>
            </div>
          ) : null;
        })()}
      </div>

      {/* ── CG (advanced) ── */}
      <SectionHeader>CG Position</SectionHeader>
      <div className="px-4">
        <NumberStepper
          value={cfg.h_cg}
          onChange={(v) => set('h_cg', v)}
          min={0.10}
          max={0.45}
          step={0.01}
          unit="MAC"
          format={(v) => `${(v * 100).toFixed(0)}%`}
        />
        <div className="text-center text-xs text-gray-600 mt-1">Typical: 25–35% MAC</div>
      </div>

    </div>
  );
}
