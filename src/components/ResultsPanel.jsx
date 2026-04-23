import React from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ResponsiveContainer,
} from 'recharts';

const PENALTY_LABELS = {
  VHT_LOW: 'Horizontal tail undersized',
  VVT_LOW: 'Vertical tail undersized',
  TWR_CRITICAL: 'Thrust-to-weight critically low',
  UNSTABLE: 'CG aft of neutral point',
  PAYLOAD_FRACTION_LOW: 'Payload fraction < 25%',
  T_TAIL: 'T-tail deep-stall risk',
};

// ── Primitives ────────────────────────────────────────────────────────────────

function Block({ children, className = '' }) {
  return <div className={`bg-gray-900 rounded-xl border border-gray-800 ${className}`}>{children}</div>;
}

function BlockHeader({ children }) {
  return (
    <div className="px-4 py-3 border-b border-gray-800 text-xs font-bold text-gray-400 uppercase tracking-widest">
      {children}
    </div>
  );
}

function Metric({ label, value, color = 'text-white', sub }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-gray-800/60 last:border-0">
      <span className="text-sm text-gray-400">{label}</span>
      <div className="text-right">
        <span className={`text-sm font-semibold tabular-nums ${color}`}>{value}</span>
        {sub && <div className="text-xs text-gray-600 mt-0.5">{sub}</div>}
      </div>
    </div>
  );
}

function WarningBubble({ w }) {
  const styles = {
    critical: { bar: 'bg-red-500', bg: 'bg-red-950/50 border-red-900', text: 'text-red-300', icon: '✕' },
    warning:  { bar: 'bg-yellow-500', bg: 'bg-yellow-950/50 border-yellow-900', text: 'text-yellow-300', icon: '!' },
    info:     { bar: 'bg-blue-500', bg: 'bg-blue-950/30 border-blue-900', text: 'text-blue-300', icon: 'i' },
  };
  const s = styles[w.severity] ?? styles.info;
  return (
    <div className={`flex gap-3 rounded-lg border p-3 text-xs ${s.bg}`}>
      <div className={`w-1 rounded-full flex-shrink-0 ${s.bar}`} />
      <span className={`leading-relaxed ${s.text}`}>{w.message}</span>
    </div>
  );
}

// ── Weight breakdown bar ──────────────────────────────────────────────────────

function WeightBar({ items, total }) {
  if (!total || !items) return null;
  return (
    <div>
      <div className="flex h-3 rounded-full overflow-hidden">
        {items.filter(i => i.kg > 0).map((item) => (
          <div
            key={item.label}
            style={{ width: `${(item.kg / total) * 100}%`, backgroundColor: item.color }}
            title={`${item.label}: ${(item.kg * 1000).toFixed(0)} g`}
          />
        ))}
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
        {items.filter(i => i.kg > 0).map((item) => (
          <div key={item.label} className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-sm flex-shrink-0" style={{ backgroundColor: item.color }} />
            <span className="text-xs text-gray-500">
              {item.label} <span className="text-gray-400">{(item.kg * 1000).toFixed(0)} g</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Score ring ────────────────────────────────────────────────────────────────

function ScoreRing({ score }) {
  const r = 28;
  const circ = 2 * Math.PI * r;
  const filled = (Math.max(0, Math.min(100, score)) / 100) * circ;
  const color = score >= 70 ? '#22c55e' : score >= 40 ? '#eab308' : '#ef4444';
  return (
    <svg width="72" height="72" viewBox="0 0 72 72">
      <circle cx="36" cy="36" r={r} fill="none" stroke="#1f2937" strokeWidth="6" />
      <circle
        cx="36" cy="36" r={r}
        fill="none"
        stroke={color}
        strokeWidth="6"
        strokeDasharray={`${filled} ${circ - filled}`}
        strokeLinecap="round"
        transform="rotate(-90 36 36)"
      />
      <text x="36" y="40" textAnchor="middle" fill={color} fontSize="14" fontWeight="bold" fontFamily="system-ui">
        {score}
      </text>
    </svg>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function ResultsPanel({ result, cfg }) {
  if (!result) {
    return <div className="p-8 text-gray-600 text-sm">Calculating…</div>;
  }

  if (result.error) {
    return (
      <div className="p-8">
        <Block className="border-red-900">
          <div className="p-5 text-red-400 text-sm">
            <div className="font-bold mb-2 text-red-300">Calculation error</div>
            {result.error}
          </div>
        </Block>
      </div>
    );
  }

  const {
    maxPayloadKg, efficiencyScore,
    thrustMargin, thrustStatic, thrustRequired,
    LD_ratio, V_stall, TWR, payloadFraction, enduranceMin,
    staticMargin, stabilityStatus,
    W_wing, W_tail, W_total, W_empty,
    V_ht, V_vt, AR,
    activeWarnings, penaltyBreakdown,
    scissorsData,
    geo,
  } = result;

  const canFly = !activeWarnings?.some((w) => w.severity === 'critical');
  const criticals = activeWarnings?.filter((w) => w.severity === 'critical') ?? [];
  const warnings = activeWarnings?.filter((w) => w.severity === 'warning') ?? [];
  const infos = activeWarnings?.filter((w) => w.severity === 'info') ?? [];

  const W_payload = cfg.payloadKg;

  // Stability badge color
  const stabColor = staticMargin >= 0.05 ? 'text-green-400 bg-green-900/40 border-green-800'
    : staticMargin >= 0 ? 'text-yellow-400 bg-yellow-900/40 border-yellow-800'
    : 'text-red-400 bg-red-900/40 border-red-800';

  const smPct = staticMargin != null ? `${(staticMargin * 100).toFixed(1)}%` : '—';
  const ld = LD_ratio?.toFixed(1) ?? '—';
  const vs = V_stall?.toFixed(2) ?? '—';
  const twr = TWR?.toFixed(3) ?? '—';
  const pf = payloadFraction != null ? `${(payloadFraction * 100).toFixed(1)}%` : '—';
  const end = enduranceMin != null ? `${enduranceMin.toFixed(1)} min` : '—';

  return (
    <div className="p-6 space-y-5 max-w-3xl mx-auto">

      {/* ── Verdict ── */}
      <div className={`rounded-2xl border-2 px-6 py-5 flex items-center gap-5 ${
        canFly
          ? 'bg-green-950/30 border-green-700'
          : 'bg-red-950/30 border-red-700'
      }`}>
        <div className={`text-4xl font-black tracking-tight ${canFly ? 'text-green-400' : 'text-red-400'}`}>
          {canFly ? '✓' : '✕'}
        </div>
        <div>
          <div className={`text-xl font-bold ${canFly ? 'text-green-300' : 'text-red-300'}`}>
            {canFly ? 'This design will fly' : 'Design has critical issues'}
          </div>
          <div className="text-sm text-gray-400 mt-0.5">
            {canFly
              ? `Lifts up to ${maxPayloadKg?.toFixed(2)} kg payload · stalls at ${vs} m/s`
              : criticals.map((c) => c.code).join(', ')}
          </div>
        </div>
        {efficiencyScore != null && (
          <div className="ml-auto flex-shrink-0 flex flex-col items-center gap-1">
            <ScoreRing score={efficiencyScore} />
            <span className="text-xs text-gray-500">efficiency</span>
          </div>
        )}
      </div>

      {/* ── Three key numbers ── */}
      <div className="grid grid-cols-3 gap-4">
        <Block className="p-4 text-center">
          <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Max Payload</div>
          <div className={`text-3xl font-black tabular-nums ${maxPayloadKg > 0.3 ? 'text-green-400' : maxPayloadKg > 0 ? 'text-yellow-400' : 'text-red-400'}`}>
            {maxPayloadKg?.toFixed(2) ?? '—'}
          </div>
          <div className="text-sm text-gray-500 mt-0.5">kg</div>
        </Block>
        <Block className="p-4 text-center">
          <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Stall Speed</div>
          <div className={`text-3xl font-black tabular-nums ${V_stall <= 6 ? 'text-green-400' : V_stall <= 8 ? 'text-yellow-400' : 'text-red-400'}`}>
            {vs}
          </div>
          <div className="text-sm text-gray-500 mt-0.5">m/s</div>
        </Block>
        <Block className="p-4 text-center">
          <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Thrust Margin</div>
          <div className={`text-3xl font-black tabular-nums ${thrustMargin > 0 ? 'text-green-400' : 'text-red-400'}`}>
            {thrustMargin?.toFixed(0) ?? '—'}
          </div>
          <div className="text-sm text-gray-500 mt-0.5">g surplus</div>
        </Block>
      </div>

      {/* ── Auto-computed geometry (info only) ── */}
      {geo && (
        <Block>
          <BlockHeader>Auto-computed geometry</BlockHeader>
          <div className="px-4 py-3 grid grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-xs text-gray-500 mb-0.5">Wing area</div>
              <div className="text-white font-semibold">{geo.S.toFixed(3)} m²</div>
            </div>
            <div className="text-center">
              <div className="text-xs text-gray-500 mb-0.5">Chord</div>
              <div className="text-white font-semibold">{(geo.c * 100).toFixed(1)} cm</div>
            </div>
            <div className="text-center">
              <div className="text-xs text-gray-500 mb-0.5">Aspect ratio</div>
              <div className="text-white font-semibold">{(geo.b ** 2 / geo.S).toFixed(2)}</div>
            </div>
            <div className="text-center">
              <div className="text-xs text-gray-500 mb-0.5">Tail arm</div>
              <div className="text-white font-semibold">{geo.L_ht.toFixed(2)} m</div>
            </div>
          </div>
          <div className="border-t border-gray-800 px-4 py-2.5 grid grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-xs text-gray-500 mb-0.5">S_ht</div>
              <div className="text-gray-300 font-medium">{geo.S_ht.toFixed(4)} m²</div>
            </div>
            <div className="text-center">
              <div className="text-xs text-gray-500 mb-0.5">S_vt</div>
              <div className="text-gray-300 font-medium">{geo.S_vt.toFixed(4)} m²</div>
            </div>
            <div className="text-center">
              <div className="text-xs text-gray-500 mb-0.5">V_ht</div>
              <div className={`font-medium ${V_ht >= 0.4 ? 'text-green-400' : 'text-red-400'}`}>
                {V_ht?.toFixed(3)}
              </div>
            </div>
            <div className="text-center">
              <div className="text-xs text-gray-500 mb-0.5">V_vt</div>
              <div className={`font-medium ${V_vt >= 0.02 ? 'text-green-400' : 'text-red-400'}`}>
                {V_vt?.toFixed(3)}
              </div>
            </div>
          </div>
        </Block>
      )}

      <div className="grid grid-cols-2 gap-4">
        {/* ── Performance ── */}
        <Block>
          <BlockHeader>Performance</BlockHeader>
          <div className="px-4 py-1">
            <Metric
              label="L/D ratio"
              value={ld}
              color={LD_ratio > 10 ? 'text-green-400' : LD_ratio > 6 ? 'text-yellow-400' : 'text-red-400'}
              sub={LD_ratio > 10 ? 'excellent' : LD_ratio > 6 ? 'ok' : 'poor'}
            />
            <Metric
              label="TWR"
              value={twr}
              color={TWR >= 0.5 ? 'text-green-400' : TWR >= 0.3 ? 'text-yellow-400' : 'text-red-400'}
              sub={TWR >= 0.5 ? 'good' : TWR >= 0.3 ? 'marginal' : 'critical'}
            />
            <Metric
              label="Payload fraction"
              value={pf}
              color={payloadFraction >= 0.4 ? 'text-green-400' : payloadFraction >= 0.25 ? 'text-yellow-400' : 'text-red-400'}
              sub="target: 40–60%"
            />
            <Metric label="Endurance (est.)" value={end} />
          </div>
        </Block>

        {/* ── Stability ── */}
        <Block>
          <BlockHeader>Stability</BlockHeader>
          <div className="px-4 py-3">
            <div className="flex justify-between items-center mb-3">
              <span className="text-sm text-gray-400">Status</span>
              <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${stabColor}`}>
                {stabilityStatus?.toUpperCase() ?? '—'}
              </span>
            </div>
            <div className="py-1 border-b border-gray-800/60">
              <div className="flex justify-between mb-1">
                <span className="text-sm text-gray-400">Static margin</span>
                <span className={`text-sm font-semibold ${staticMargin >= 0.05 ? 'text-green-400' : staticMargin >= 0 ? 'text-yellow-400' : 'text-red-400'}`}>
                  {smPct}
                </span>
              </div>
              {staticMargin != null && (
                <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${staticMargin >= 0.05 ? 'bg-green-500' : staticMargin >= 0 ? 'bg-yellow-500' : 'bg-red-500'}`}
                    style={{ width: `${Math.max(0, Math.min(100, (staticMargin / 0.30) * 100))}%` }}
                  />
                </div>
              )}
            </div>
            <Metric label="V_ht" value={V_ht?.toFixed(3) ?? '—'} color={V_ht >= 0.4 ? 'text-green-400' : 'text-red-400'} sub="target ≥ 0.40" />
            <Metric label="V_vt" value={V_vt?.toFixed(3) ?? '—'} color={V_vt >= 0.02 ? 'text-green-400' : 'text-red-400'} sub="target ≥ 0.02" />
          </div>
        </Block>
      </div>

      {/* ── Weight breakdown ── */}
      {W_total != null && (
        <Block>
          <BlockHeader>Weight breakdown — {(W_total * 1000).toFixed(0)} g total</BlockHeader>
          <div className="px-4 py-3">
            <WeightBar
              total={W_total}
              items={[
                { label: 'Payload', kg: cfg.payloadKg, color: '#22c55e' },
                { label: 'Wing', kg: W_wing ?? 0, color: '#3b82f6' },
                { label: 'Tail', kg: W_tail ?? 0, color: '#60a5fa' },
                { label: 'Structure', kg: Math.max(0, W_empty - (W_wing ?? 0) - (W_tail ?? 0)), color: '#6b7280' },
              ]}
            />
            <div className="mt-3 flex gap-6 text-xs text-gray-500">
              <span>Empty: <span className="text-gray-300 font-medium">{W_empty != null ? (W_empty * 1000).toFixed(0) : '—'} g</span></span>
              <span>Payload fraction: <span className="text-gray-300 font-medium">{pf}</span></span>
              <span>Payload/empty: <span className="text-gray-300 font-medium">{W_empty > 0 ? (cfg.payloadKg / W_empty).toFixed(2) : '—'}</span></span>
            </div>
          </div>
        </Block>
      )}

      {/* ── Thrust ── */}
      <Block>
        <BlockHeader>Thrust budget</BlockHeader>
        <div className="px-4 py-3 flex items-center gap-4">
          <div className="flex-1 space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Available</span>
              <span className="text-white font-semibold">{thrustStatic?.toFixed(0) ?? '—'} g</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Required (level flight)</span>
              <span className="text-white font-semibold">{thrustRequired?.toFixed(0) ?? '—'} g</span>
            </div>
            <div className="flex justify-between text-sm border-t border-gray-800 pt-1 mt-1">
              <span className="text-gray-500">Surplus</span>
              <span className={`font-bold ${thrustMargin > 0 ? 'text-green-400' : 'text-red-400'}`}>
                {thrustMargin?.toFixed(0) ?? '—'} g
              </span>
            </div>
          </div>
          {thrustStatic > 0 && thrustRequired > 0 && (
            <div className="flex-shrink-0">
              <div className="relative w-16 h-16">
                <svg viewBox="0 0 64 64" className="w-full h-full">
                  <circle cx="32" cy="32" r="26" fill="none" stroke="#1f2937" strokeWidth="5" />
                  <circle
                    cx="32" cy="32" r="26"
                    fill="none"
                    stroke={thrustMargin > 0 ? '#22c55e' : '#ef4444'}
                    strokeWidth="5"
                    strokeDasharray={`${Math.min(1, thrustRequired / thrustStatic) * 163.4} ${163.4}`}
                    strokeLinecap="round"
                    transform="rotate(-90 32 32)"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-gray-300">
                  {((thrustRequired / thrustStatic) * 100).toFixed(0)}%
                </div>
              </div>
              <div className="text-center text-xs text-gray-600 mt-1">used</div>
            </div>
          )}
        </div>
      </Block>

      {/* ── Warnings ── */}
      {activeWarnings?.length > 0 && (
        <Block className={criticals.length > 0 ? 'border-red-900' : 'border-yellow-900'}>
          <BlockHeader>{criticals.length > 0 ? `${criticals.length} Critical Issue${criticals.length > 1 ? 's' : ''}` : 'Warnings'}</BlockHeader>
          <div className="px-4 py-3 space-y-2">
            {[...criticals, ...warnings, ...infos].map((w, i) => (
              <WarningBubble key={i} w={w} />
            ))}
          </div>
        </Block>
      )}

      {/* ── Score breakdown ── */}
      {penaltyBreakdown?.length > 0 && (
        <Block>
          <BlockHeader>Score penalties</BlockHeader>
          <div className="px-4 py-2">
            {penaltyBreakdown.map((p, i) => (
              <div key={i} className="flex justify-between items-center py-1.5 border-b border-gray-800/50 last:border-0 text-sm">
                <span className="text-gray-400">{PENALTY_LABELS[p.code] ?? p.code}</span>
                <span className="text-red-400 font-bold">{p.points}</span>
              </div>
            ))}
          </div>
        </Block>
      )}

      {/* ── Scissors diagram ── */}
      {scissorsData?.length > 0 && (
        <Block>
          <BlockHeader>Scissors diagram — V_ht vs neutral point</BlockHeader>
          <div className="px-4 py-4">
            <div className="text-xs text-gray-500 mb-3">
              Current: V_ht = <span className="text-gray-300 font-medium">{V_ht?.toFixed(3)}</span>
              &nbsp;·&nbsp; NP at <span className="text-gray-300 font-medium">{result.h_n != null ? `${(result.h_n * 100).toFixed(1)}%` : '—'}</span> MAC
              &nbsp;·&nbsp; SM = <span className={staticMargin >= 0.05 ? 'text-green-400 font-medium' : 'text-yellow-400 font-medium'}>{smPct}</span>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={scissorsData} margin={{ top: 4, right: 12, left: -20, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                <XAxis
                  dataKey="V_ht"
                  tick={{ fill: '#6b7280', fontSize: 10, fontFamily: 'system-ui' }}
                  tickFormatter={(v) => v.toFixed(2)}
                />
                <YAxis tick={{ fill: '#6b7280', fontSize: 10, fontFamily: 'system-ui' }} tickFormatter={(v) => v.toFixed(2)} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#111827', border: '1px solid #374151', borderRadius: 8, fontSize: 12 }}
                  labelFormatter={(v) => `V_ht = ${Number(v).toFixed(3)}`}
                  itemStyle={{ color: '#d1d5db' }}
                />
                {V_ht != null && (
                  <ReferenceLine
                    x={parseFloat(V_ht.toFixed(4))}
                    stroke="#3b82f6"
                    strokeDasharray="4 3"
                    strokeWidth={1.5}
                  />
                )}
                <Line dataKey="NP" name="Neutral Point" stroke="#22c55e" dot={false} strokeWidth={2} />
                <Line dataKey="CGlimit" name="Aft CG limit (SM≥5%)" stroke="#f59e0b" dot={false} strokeWidth={1.5} strokeDasharray="5 3" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Block>
      )}

    </div>
  );
}
