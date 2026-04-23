import React from 'react';
import { AIRFOILS } from '../data/airfoils.js';
import { TAIL_CONFIGS } from '../data/tailConfigs.js';
import { WING_CONFIGS } from '../data/wingConfigs.js';
import { MOTORS } from '../data/motors.js';
import { MATERIALS } from '../data/materials.js';

function Section({ title, children }) {
  return (
    <div className="border-b border-gray-800">
      <div className="px-3 py-2 bg-gray-900 text-xs font-bold text-blue-400 uppercase tracking-widest">
        {title}
      </div>
      <div className="px-3 py-3 space-y-3">{children}</div>
    </div>
  );
}

function SliderRow({ label, value, min, max, step, unit, onChange, decimals = 2 }) {
  return (
    <div>
      <div className="flex justify-between items-center mb-1">
        <span className="text-gray-400 text-xs">{label}</span>
        <span className="text-white text-xs tabular-nums">
          {typeof value === 'number' ? value.toFixed(decimals) : value}
          {unit && <span className="text-gray-500 ml-1">{unit}</span>}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full"
      />
    </div>
  );
}

function Select({ label, value, options, onChange, getLabel, getValue }) {
  return (
    <div>
      <div className="text-gray-400 text-xs mb-1">{label}</div>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-gray-800 border border-gray-700 text-white text-xs rounded px-2 py-1.5 focus:outline-none focus:border-blue-500"
      >
        {options.map((opt) => (
          <option key={getValue(opt)} value={getValue(opt)}>
            {getLabel(opt)}
          </option>
        ))}
      </select>
    </div>
  );
}

function Toggle({ label, value, onChange }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-gray-400 text-xs">{label}</span>
      <button
        onClick={() => onChange(!value)}
        className={`relative w-9 h-5 rounded-full transition-colors ${value ? 'bg-blue-600' : 'bg-gray-700'}`}
      >
        <span
          className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${value ? 'translate-x-4' : 'translate-x-0.5'}`}
        />
      </button>
    </div>
  );
}

function NumberInput({ label, value, unit, onChange, min, max, step = 1 }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-gray-400 text-xs flex-1">{label}</span>
      <div className="flex items-center gap-1">
        <input
          type="number"
          value={value}
          min={min}
          max={max}
          step={step}
          onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
          className="w-20 bg-gray-800 border border-gray-700 text-white text-xs rounded px-2 py-1 text-right focus:outline-none focus:border-blue-500"
        />
        {unit && <span className="text-gray-500 text-xs">{unit}</span>}
      </div>
    </div>
  );
}

export default function LeftPanel({ cfg, set }) {
  const wingConfig = WING_CONFIGS.find((w) => w.id === cfg.wingConfigId);
  const tailConfig = TAIL_CONFIGS.find((t) => t.id === cfg.tailConfigId);
  const isBiplane = cfg.wingConfigId === 'BIPLANE' || cfg.wingConfigId === 'SESQUIPLANE';
  const isCustomMotor = cfg.motorId === 'CUSTOM';

  return (
    <div className="text-sm">
      {/* ── Section 1: Wing ── */}
      <Section title="Wing">
        <Select
          label="Configuration"
          value={cfg.wingConfigId}
          options={WING_CONFIGS}
          onChange={(v) => set('wingConfigId', v)}
          getValue={(o) => o.id}
          getLabel={(o) => o.name}
        />
        {wingConfig && (
          <div className="text-xs text-gray-500 italic leading-tight">{wingConfig.note}</div>
        )}
        <SliderRow label="Wing Area S" value={cfg.S} min={0.10} max={2.50} step={0.01} unit="m²" onChange={(v) => set('S', v)} />
        <SliderRow label="Span b" value={cfg.b} min={0.30} max={3.00} step={0.01} unit="m" onChange={(v) => set('b', v)} />
        <SliderRow label="Chord c (MAC)" value={cfg.c} min={0.05} max={0.80} step={0.01} unit="m" onChange={(v) => set('c', v)} />
        {isBiplane && (
          <SliderRow
            label="Gap / Chord ratio"
            value={cfg.gapChordRatio}
            min={0.5}
            max={2.5}
            step={0.05}
            unit=""
            onChange={(v) => set('gapChordRatio', v)}
          />
        )}
        <Select
          label="Airfoil"
          value={cfg.airfoilId}
          options={AIRFOILS}
          onChange={(v) => set('airfoilId', v)}
          getValue={(o) => o.id}
          getLabel={(o) => `${o.name}  (CL_max ${o.CL_max})`}
        />
        <Toggle label="Flaperons" value={cfg.flaperonsEnabled} onChange={(v) => set('flaperonsEnabled', v)} />
      </Section>

      {/* ── Section 2: Tail ── */}
      <Section title="Tail">
        <Select
          label="Configuration"
          value={cfg.tailConfigId}
          options={TAIL_CONFIGS}
          onChange={(v) => set('tailConfigId', v)}
          getValue={(o) => o.id}
          getLabel={(o) => o.name}
        />
        <SliderRow label="Horiz. tail area S_ht" value={cfg.S_ht} min={0.02} max={0.50} step={0.01} unit="m²" onChange={(v) => set('S_ht', v)} />
        <SliderRow label="Vert. tail area S_vt" value={cfg.S_vt} min={0.01} max={0.30} step={0.005} unit="m²" onChange={(v) => set('S_vt', v)} />
        <SliderRow label="Horiz. tail arm L_ht" value={cfg.L_ht} min={0.20} max={2.00} step={0.01} unit="m" onChange={(v) => set('L_ht', v)} />
        <SliderRow label="Vert. tail arm L_vt" value={cfg.L_vt} min={0.20} max={2.00} step={0.01} unit="m" onChange={(v) => set('L_vt', v)} />
        {tailConfig?.requiresDihedral && (
          <SliderRow label="V-tail dihedral" value={cfg.dihedralAngle} min={10} max={60} step={1} unit="°" decimals={0} onChange={(v) => set('dihedralAngle', v)} />
        )}
      </Section>

      {/* ── Section 3: Power System ── */}
      <Section title="Power System">
        <Select
          label="Motor"
          value={cfg.motorId}
          options={MOTORS}
          onChange={(v) => set('motorId', v)}
          getValue={(o) => o.id}
          getLabel={(o) => o.name}
        />
        {isCustomMotor ? (
          <>
            <NumberInput label="Max thrust" value={cfg.manualThrustG} unit="g" onChange={(v) => set('manualThrustG', v)} min={0} max={5000} step={10} />
            <NumberInput label="Motor weight" value={cfg.manualMotorWeightG} unit="g" onChange={(v) => set('manualMotorWeightG', v)} min={0} max={500} step={1} />
          </>
        ) : (
          <div className="text-xs text-gray-500 space-y-0.5">
            {(() => {
              const m = MOTORS.find((m) => m.id === cfg.motorId);
              return m ? (
                <>
                  <div>{m.note}</div>
                  <div className="text-gray-600">Prop: {m.recommendedPropIn} · {m.weightG}g · {m.maxThrustG}g thrust</div>
                </>
              ) : null;
            })()}
          </div>
        )}
        <div className="flex gap-2">
          <div className="flex-1">
            <div className="text-gray-400 text-xs mb-1">Battery</div>
            <select
              value={cfg.batteryS}
              onChange={(e) => set('batteryS', parseInt(e.target.value))}
              className="w-full bg-gray-800 border border-gray-700 text-white text-xs rounded px-2 py-1.5 focus:outline-none focus:border-blue-500"
            >
              {[2, 3, 4, 5, 6].map((s) => (
                <option key={s} value={s}>{s}S LiPo</option>
              ))}
            </select>
          </div>
          <div className="flex-1">
            <div className="text-gray-400 text-xs mb-1">Capacity</div>
            <select
              value={cfg.batteryCapacityMAh}
              onChange={(e) => set('batteryCapacityMAh', parseInt(e.target.value))}
              className="w-full bg-gray-800 border border-gray-700 text-white text-xs rounded px-2 py-1.5 focus:outline-none focus:border-blue-500"
            >
              {[1000, 1300, 1500, 2200, 3000, 4000, 5000].map((c) => (
                <option key={c} value={c}>{c} mAh</option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <div className="flex justify-between items-center mb-1">
            <span className="text-gray-400 text-xs">Cruise throttle</span>
            <span className="text-white text-xs tabular-nums">{Math.round(cfg.throttleFraction * 100)}<span className="text-gray-500 ml-1">%</span></span>
          </div>
          <input
            type="range"
            min={0.3}
            max={1.0}
            step={0.01}
            value={cfg.throttleFraction}
            onChange={(e) => set('throttleFraction', parseFloat(e.target.value))}
            className="w-full"
          />
        </div>
      </Section>

      {/* ── Section 4: Materials & Weight ── */}
      <Section title="Materials &amp; Weight">
        <Select
          label="Wing material"
          value={cfg.wingMaterialId}
          options={MATERIALS}
          onChange={(v) => set('wingMaterialId', v)}
          getValue={(o) => o.id}
          getLabel={(o) => `${o.name} (${o.densityKgM2} kg/m²)`}
        />
        <Select
          label="Tail material"
          value={cfg.tailMaterialId}
          options={MATERIALS}
          onChange={(v) => set('tailMaterialId', v)}
          getValue={(o) => o.id}
          getLabel={(o) => `${o.name}`}
        />
        <SliderRow label="Target payload" value={cfg.payloadKg} min={0.05} max={3.00} step={0.05} unit="kg" onChange={(v) => set('payloadKg', v)} />
        <SliderRow label="Fuselage width" value={cfg.fuselageWidth} min={0.05} max={0.40} step={0.01} unit="m" onChange={(v) => set('fuselageWidth', v)} />
        <SliderRow label="Fuselage height" value={cfg.fuselageHeight} min={0.05} max={0.40} step={0.01} unit="m" onChange={(v) => set('fuselageHeight', v)} />
        <NumberInput label="Fuselage weight" value={cfg.fuselageWeightG} unit="g" onChange={(v) => set('fuselageWeightG', v)} min={0} max={2000} step={10} />
        <NumberInput label="Electronics weight" value={cfg.electronicsWeightG} unit="g" onChange={(v) => set('electronicsWeightG', v)} min={50} max={500} step={5} />
      </Section>

      {/* ── Section 5: Flight Conditions ── */}
      <Section title="Flight Conditions">
        <SliderRow label="CG position (% MAC)" value={cfg.h_cg} min={0.10} max={0.50} step={0.01} unit="" onChange={(v) => set('h_cg', v)} />
        <SliderRow label="Cruise AOA" value={cfg.aoa} min={-2} max={15} step={0.5} unit="°" onChange={(v) => set('aoa', v)} />
        <SliderRow label="Air density ρ" value={cfg.rho} min={0.90} max={1.30} step={0.005} unit="kg/m³" decimals={3} onChange={(v) => set('rho', v)} />
        <div className="text-xs text-gray-600">Sea level std: 1.225 kg/m³</div>
      </Section>
    </div>
  );
}
