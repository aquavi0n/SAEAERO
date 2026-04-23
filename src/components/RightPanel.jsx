import React from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ResponsiveContainer,
} from 'recharts';
import { calcBatteryWeight } from '../logic/powerCalcs.js';
import { MOTORS } from '../data/motors.js';

function BigStat({ label, value, unit, color, sub }) {
  return (
    <div className="flex flex-col">
      <span className="text-gray-500 text-xs uppercase tracking-wider">{label}</span>
      <div className="flex items-end gap-1.5 mt-0.5">
        <span className={`text-2xl font-bold tabular-nums leading-none ${color}`}>{value}</span>
        {unit && <span className="text-gray-500 text-sm mb-0.5">{unit}</span>}
      </div>
      {sub && <span className="text-gray-600 text-xs mt-0.5">{sub}</span>}
    </div>
  );
}

function MetricRow({ label, value, color, warn }) {
  return (
    <div className="flex justify-between items-center py-1 border-b border-gray-800 last:border-0">
      <span className="text-gray-400 text-xs">{label}</span>
      <span className={`text-xs font-bold tabular-nums ${color ?? (warn ? 'text-yellow-400' : 'text-gray-200')}`}>{value}</span>
    </div>
  );
}

function Badge({ text, color }) {
  const classes = {
    green: 'bg-green-900 text-green-400 border-green-800',
    yellow: 'bg-yellow-900 text-yellow-400 border-yellow-800',
    red: 'bg-red-900 text-red-400 border-red-800',
    gray: 'bg-gray-800 text-gray-400 border-gray-700',
  }[color] ?? 'bg-gray-800 text-gray-400 border-gray-700';
  return (
    <span className={`inline-block px-2 py-0.5 rounded text-xs font-bold border ${classes}`}>{text}</span>
  );
}

function Section({ title, children }) {
  return (
    <div className="border-b border-gray-800">
      <div className="px-3 py-2 bg-gray-900 text-xs font-bold text-blue-400 uppercase tracking-widest">
        {title}
      </div>
      <div className="px-3 py-3">{children}</div>
    </div>
  );
}

function WarningItem({ w }) {
  const colors = {
    critical: 'text-red-400 border-red-900 bg-red-950',
    warning: 'text-yellow-400 border-yellow-900 bg-yellow-950',
    info: 'text-blue-400 border-blue-900 bg-blue-950',
  };
  const icons = { critical: '✕', warning: '⚠', info: 'ℹ' };
  const cls = colors[w.severity] ?? colors.info;
  return (
    <div className={`flex gap-2 px-2 py-1.5 rounded border text-xs ${cls} mb-1.5`}>
      <span className="flex-shrink-0 font-bold">{icons[w.severity]}</span>
      <span className="leading-snug">{w.message}</span>
    </div>
  );
}

function PenaltyItem({ p }) {
  return (
    <div className="flex justify-between items-center text-xs py-0.5">
      <span className="text-gray-500">{p.reason}</span>
      <span className="text-red-400 font-bold tabular-nums">{p.points > 0 ? '+' : ''}{p.points}</span>
    </div>
  );
}

function ScoreBar({ score }) {
  const color = score >= 70 ? '#22c55e' : score >= 40 ? '#eab308' : '#ef4444';
  return (
    <div className="w-full bg-gray-800 rounded-full h-2 overflow-hidden">
      <div
        className="h-2 rounded-full transition-all duration-300"
        style={{ width: `${Math.max(0, Math.min(100, score))}%`, backgroundColor: color }}
      />
    </div>
  );
}

function WeightBar({ W_wing, W_tail, W_fuselage, W_motor, W_battery, W_electronics, W_payload, W_total }) {
  if (!W_total) return null;
  const pct = (v) => `${((v / W_total) * 100).toFixed(1)}%`;
  const segments = [
    { label: 'Payload', kg: W_payload, color: '#22c55e' },
    { label: 'Wing', kg: W_wing, color: '#3b82f6' },
    { label: 'Tail', kg: W_tail, color: '#60a5fa' },
    { label: 'Fuse', kg: W_fuselage, color: '#6b7280' },
    { label: 'Motor', kg: W_motor, color: '#f59e0b' },
    { label: 'Battery', kg: W_battery, color: '#a855f7' },
    { label: 'Electronics', kg: W_electronics, color: '#14b8a6' },
  ].filter((s) => s.kg > 0);

  return (
    <div>
      <div className="flex h-4 rounded overflow-hidden w-full mb-1">
        {segments.map((s) => (
          <div
            key={s.label}
            style={{ width: `${(s.kg / W_total) * 100}%`, backgroundColor: s.color }}
            title={`${s.label}: ${(s.kg * 1000).toFixed(0)} g (${pct(s.kg)})`}
          />
        ))}
      </div>
      <div className="flex flex-wrap gap-x-3 gap-y-0.5">
        {segments.map((s) => (
          <div key={s.label} className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-sm flex-shrink-0" style={{ backgroundColor: s.color }} />
            <span className="text-xs text-gray-500">{s.label} {pct(s.kg)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function RightPanel({ result, cfg }) {
  if (!result) return <div className="p-4 text-gray-600 text-xs">Calculating…</div>;

  if (result.error) {
    return (
      <div className="p-4">
        <div className="bg-red-950 border border-red-900 rounded p-3 text-red-400 text-xs">
          <div className="font-bold mb-1">Calculation error</div>
          {result.error}
        </div>
      </div>
    );
  }

  const {
    maxPayloadKg, efficiencyScore, thrustMargin,
    LD_ratio, V_stall, TWR, payloadFraction, enduranceMin,
    staticMargin, stabilityStatus,
    W_wing, W_tail, W_total, W_empty, W_fuselage,
    V_ht, V_vt,
    thrustStatic, thrustRequired,
    activeWarnings, penaltyBreakdown,
    scissorsData,
  } = result;

  const selectedMotor = MOTORS.find((m) => m.id === cfg.motorId);
  const motorWeightG = cfg.motorId === 'CUSTOM' ? cfg.manualMotorWeightG : (selectedMotor?.weightG ?? 0);
  const W_motor_kg = motorWeightG / 1000;
  const W_battery_kg = calcBatteryWeight(cfg.batteryS, cfg.batteryCapacityMAh);
  const W_fuselage_kg = cfg.fuselageWeightG / 1000;
  const W_electronics_kg = cfg.electronicsWeightG / 1000;

  const smColor = staticMargin >= 0.05 ? 'text-green-400'
    : staticMargin >= 0 ? 'text-yellow-400'
    : 'text-red-400';

  const smBadgeColor = staticMargin >= 0.05 ? 'green'
    : staticMargin >= 0 ? 'yellow'
    : 'red';

  const stabColor = stabilityStatus === 'stable' ? 'green'
    : stabilityStatus === 'marginal' ? 'yellow'
    : 'red';

  const payloadColor = maxPayloadKg > 0.5 ? 'text-green-400'
    : maxPayloadKg > 0.2 ? 'text-yellow-400'
    : 'text-red-400';

  const scoreColor = efficiencyScore >= 70 ? 'text-green-400'
    : efficiencyScore >= 40 ? 'text-yellow-400'
    : 'text-red-400';

  const thrustMarginColor = thrustMargin > 0 ? 'text-green-400' : 'text-red-400';

  const criticals = activeWarnings.filter((w) => w.severity === 'critical');
  const warnings = activeWarnings.filter((w) => w.severity === 'warning');
  const infos = activeWarnings.filter((w) => w.severity === 'info');

  return (
    <div className="text-sm">
      {/* ── Big Numbers ── */}
      <Section title="Key Outputs">
        <div className="grid grid-cols-1 gap-4">
          <BigStat
            label="Max liftable payload"
            value={maxPayloadKg != null ? maxPayloadKg.toFixed(3) : '—'}
            unit="kg"
            color={payloadColor}
            sub={maxPayloadKg != null ? `${(maxPayloadKg * 1000).toFixed(0)} g · ${((maxPayloadKg / W_total) * 100).toFixed(1)}% of MTOW` : undefined}
          />
          <div className="flex gap-4">
            <BigStat
              label="Efficiency score"
              value={efficiencyScore != null ? efficiencyScore : '—'}
              unit="/100"
              color={scoreColor}
            />
            <BigStat
              label="Thrust margin"
              value={thrustMargin != null ? thrustMargin.toFixed(0) : '—'}
              unit="g"
              color={thrustMarginColor}
              sub={thrustMargin != null ? `${thrustStatic?.toFixed(0)} − ${thrustRequired?.toFixed(0)} g` : undefined}
            />
          </div>
          {efficiencyScore != null && (
            <ScoreBar score={efficiencyScore} />
          )}
        </div>
      </Section>

      {/* ── Performance Block ── */}
      <Section title="Aero Performance">
        <MetricRow label="L/D ratio" value={LD_ratio?.toFixed(2) ?? '—'} color={LD_ratio > 10 ? 'text-green-400' : LD_ratio > 6 ? 'text-yellow-400' : 'text-red-400'} />
        <MetricRow label="Stall speed" value={V_stall != null ? `${V_stall.toFixed(2)} m/s` : '—'} warn={V_stall > 8} color={V_stall > 8 ? 'text-yellow-400' : 'text-gray-200'} />
        <MetricRow label="TWR" value={TWR?.toFixed(3) ?? '—'} color={TWR >= 0.5 ? 'text-green-400' : TWR >= 0.3 ? 'text-yellow-400' : 'text-red-400'} />
        <MetricRow label="Payload fraction" value={payloadFraction != null ? `${(payloadFraction * 100).toFixed(1)}%` : '—'} color={payloadFraction >= 0.4 ? 'text-green-400' : payloadFraction >= 0.25 ? 'text-yellow-400' : 'text-red-400'} />
        <MetricRow label="Endurance" value={enduranceMin != null ? `${enduranceMin.toFixed(1)} min` : '—'} />
      </Section>

      {/* ── Stability Block ── */}
      <Section title="Stability">
        <div className="flex items-center justify-between mb-2">
          <span className="text-gray-400 text-xs">Status</span>
          <Badge text={stabilityStatus ?? '—'} color={stabColor} />
        </div>
        <MetricRow label="Static margin" value={staticMargin != null ? `${(staticMargin * 100).toFixed(1)}%` : '—'} color={smColor} />
        <MetricRow label="V_ht" value={V_ht?.toFixed(3) ?? '—'} color={V_ht >= 0.4 ? 'text-green-400' : 'text-red-400'} />
        <MetricRow label="V_vt" value={V_vt?.toFixed(3) ?? '—'} color={V_vt >= 0.02 ? 'text-green-400' : 'text-red-400'} />
      </Section>

      {/* ── Weight Breakdown ── */}
      <Section title="Weight Breakdown">
        <WeightBar
          W_wing={W_wing}
          W_tail={result.W_tail}
          W_fuselage={W_fuselage_kg}
          W_motor={W_motor_kg}
          W_battery={W_battery_kg}
          W_electronics={W_electronics_kg}
          W_payload={cfg.payloadKg}
          W_total={W_total}
        />
        <div className="mt-2 space-y-0">
          <MetricRow label="W_total (MTOW)" value={W_total != null ? `${(W_total * 1000).toFixed(0)} g` : '—'} />
          <MetricRow label="W_empty" value={W_empty != null ? `${(W_empty * 1000).toFixed(0)} g` : '—'} />
          <MetricRow label="W_wing" value={W_wing != null ? `${(W_wing * 1000).toFixed(0)} g` : '—'} />
          <MetricRow label="W_tail" value={result.W_tail != null ? `${(result.W_tail * 1000).toFixed(0)} g` : '—'} />
        </div>
      </Section>

      {/* ── Warnings ── */}
      {activeWarnings.length > 0 && (
        <Section title={`Warnings (${activeWarnings.length})`}>
          {criticals.map((w, i) => <WarningItem key={i} w={w} />)}
          {warnings.map((w, i) => <WarningItem key={i} w={w} />)}
          {infos.map((w, i) => <WarningItem key={i} w={w} />)}
        </Section>
      )}

      {/* ── Score penalties ── */}
      {penaltyBreakdown?.length > 0 && (
        <Section title="Score Penalties">
          {penaltyBreakdown.map((p, i) => <PenaltyItem key={i} p={p} />)}
        </Section>
      )}

      {/* ── Scissors Diagram ── */}
      {scissorsData && scissorsData.length > 0 && (
        <Section title="Scissors Diagram">
          <ScissorsDiagram data={scissorsData} result={result} />
        </Section>
      )}
    </div>
  );
}

function ScissorsDiagram({ data, result }) {
  if (!data || data.length === 0) return null;

  const V_ht_current = result?.V_ht;
  const smLabel = result?.staticMargin != null
    ? `SM = ${(result.staticMargin * 100).toFixed(1)}%  ·  V_ht = ${V_ht_current?.toFixed(3)}`
    : '';

  return (
    <div>
      <div className="text-xs text-gray-600 mb-2">{smLabel}</div>
      <ResponsiveContainer width="100%" height={180}>
        <LineChart data={data} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
          <XAxis
            dataKey="V_ht"
            tick={{ fill: '#6b7280', fontSize: 9 }}
            tickFormatter={(v) => v.toFixed(2)}
            label={{ value: 'V_ht', position: 'insideBottomRight', offset: -4, fill: '#6b7280', fontSize: 9 }}
          />
          <YAxis tick={{ fill: '#6b7280', fontSize: 9 }} tickFormatter={(v) => v.toFixed(2)} />
          <Tooltip
            contentStyle={{ backgroundColor: '#111827', border: '1px solid #374151', borderRadius: 4 }}
            labelStyle={{ color: '#9ca3af', fontSize: 10 }}
            itemStyle={{ fontSize: 10 }}
            labelFormatter={(v) => `V_ht: ${Number(v).toFixed(3)}`}
          />
          {V_ht_current != null && (
            <ReferenceLine x={V_ht_current} stroke="#3b82f6" strokeDasharray="3 3" strokeWidth={1} label={{ value: 'current', position: 'top', fill: '#3b82f6', fontSize: 8 }} />
          )}
          <Line dataKey="NP" name="Neutral Point" stroke="#22c55e" dot={false} strokeWidth={1.5} />
          <Line dataKey="CGlimit" name="Aft CG limit (SM≥5%)" stroke="#f59e0b" dot={false} strokeWidth={1.2} strokeDasharray="4 2" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
