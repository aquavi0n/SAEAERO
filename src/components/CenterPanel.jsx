import React, { useMemo } from 'react';

const W = 600;
const H = 480;
const CX = W / 2;
const CY = H / 2 - 20;

function scaleSpan(b, maxPx = 460) {
  return Math.min((b / 3.0) * maxPx, maxPx);
}

function scaleChord(c, maxPx = 80) {
  return Math.max(Math.min((c / 0.80) * maxPx, maxPx), 12);
}

function scaleTailArm(L_ht, c, maxPx = 200) {
  return Math.min(((L_ht + c * 0.5) / 2.5) * maxPx, maxPx);
}

export default function CenterPanel({ cfg, result }) {
  const {
    S, b, c,
    wingConfigId, gapChordRatio,
    S_ht, S_vt, L_ht, L_vt,
    tailConfigId,
    fuselageWidth,
  } = cfg;

  const isBiplane = wingConfigId === 'BIPLANE' || wingConfigId === 'SESQUIPLANE';
  const isHTail = tailConfigId === 'H_TAIL';
  const isVTail = tailConfigId === 'V_TAIL';
  const isTTail = tailConfigId === 'T_TAIL';

  const halfSpanPx = scaleSpan(b) / 2;
  const chordPx = scaleChord(c);
  const tailArmPx = scaleTailArm(L_ht, c);
  const fusePx = fuselageWidth * 600;

  // Tail sizing
  const htHalf = scaleSpan(Math.sqrt(S_ht * 5)) / 2;
  const htChord = scaleChord(S_ht / Math.max(Math.sqrt(S_ht * 5), 0.1));
  const vtHeight = scaleChord(Math.sqrt(S_vt * 4)) * 1.5;

  // Lower biplane wing (60% span for sesquiplane)
  const lowerSpanFactor = wingConfigId === 'SESQUIPLANE' ? 0.6 : 1.0;
  const lowerHalfSpanPx = halfSpanPx * lowerSpanFactor;

  // Fuselage
  const fuseWidth = Math.max(fusePx, 8);
  const fuseHalf = fuseWidth / 2;

  // Wing leading/trailing edge positions (top-down, y = forward is up)
  const wingLE = CY - chordPx * 0.25;
  const wingTE = wingLE + chordPx;

  const tailXCenter = CY + tailArmPx;
  const htLE = tailXCenter - htChord * 0.25;
  const htTE = htLE + htChord;

  // CG dot
  const cgX = CX;
  const cgY = wingLE + chordPx * (cfg.h_cg ?? 0.30);

  // Score color
  const score = result?.efficiencyScore;
  const scoreColor = score == null ? '#6b7280'
    : score >= 70 ? '#22c55e'
    : score >= 40 ? '#eab308'
    : '#ef4444';

  const sm = result?.staticMargin;
  const smColor = sm == null ? '#6b7280'
    : sm >= 0.05 ? '#22c55e'
    : sm >= 0 ? '#eab308'
    : '#ef4444';

  return (
    <div className="flex flex-col h-full">
      {/* SVG wireframe */}
      <div className="flex-1 flex items-center justify-center p-4">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          width="100%"
          height="100%"
          style={{ maxHeight: '100%' }}
          className="overflow-visible"
        >
          {/* Background grid */}
          <defs>
            <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#1f2937" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width={W} height={H} fill="url(#grid)" rx="4" />

          {/* ── Fuselage ── */}
          <rect
            x={CX - fuseHalf}
            y={wingLE - tailArmPx * 0.25}
            width={fuseWidth}
            height={chordPx + tailArmPx * 1.05}
            rx={fuseHalf}
            fill="none"
            stroke="#4b5563"
            strokeWidth="1.5"
          />

          {/* ── Main wing (top-down planform) ── */}
          {/* Left wing */}
          <polygon
            points={`
              ${CX},${wingLE}
              ${CX - halfSpanPx},${wingLE + chordPx * 0.15}
              ${CX - halfSpanPx},${wingLE + chordPx * 0.85}
              ${CX},${wingTE}
            `}
            fill="rgba(59,130,246,0.12)"
            stroke="#3b82f6"
            strokeWidth="1.5"
          />
          {/* Right wing */}
          <polygon
            points={`
              ${CX},${wingLE}
              ${CX + halfSpanPx},${wingLE + chordPx * 0.15}
              ${CX + halfSpanPx},${wingLE + chordPx * 0.85}
              ${CX},${wingTE}
            `}
            fill="rgba(59,130,246,0.12)"
            stroke="#3b82f6"
            strokeWidth="1.5"
          />

          {/* ── Lower biplane wing ── */}
          {isBiplane && (
            <>
              <polygon
                points={`
                  ${CX},${wingLE + chordPx * 0.1}
                  ${CX - lowerHalfSpanPx},${wingLE + chordPx * 0.25}
                  ${CX - lowerHalfSpanPx},${wingLE + chordPx * 0.85}
                  ${CX},${wingTE - chordPx * 0.1}
                `}
                fill="rgba(139,92,246,0.10)"
                stroke="#7c3aed"
                strokeWidth="1.2"
                strokeDasharray="4 3"
              />
              <polygon
                points={`
                  ${CX},${wingLE + chordPx * 0.1}
                  ${CX + lowerHalfSpanPx},${wingLE + chordPx * 0.25}
                  ${CX + lowerHalfSpanPx},${wingLE + chordPx * 0.85}
                  ${CX},${wingTE - chordPx * 0.1}
                `}
                fill="rgba(139,92,246,0.10)"
                stroke="#7c3aed"
                strokeWidth="1.2"
                strokeDasharray="4 3"
              />
              {/* Strut lines */}
              <line x1={CX - halfSpanPx * 0.5} y1={wingLE + chordPx * 0.35} x2={CX - halfSpanPx * 0.45} y2={wingLE + chordPx * 0.45} stroke="#6b7280" strokeWidth="0.8" />
              <line x1={CX + halfSpanPx * 0.5} y1={wingLE + chordPx * 0.35} x2={CX + halfSpanPx * 0.45} y2={wingLE + chordPx * 0.45} stroke="#6b7280" strokeWidth="0.8" />
            </>
          )}

          {/* ── Horizontal tail ── */}
          {!isHTail && (
            <>
              <polygon
                points={`
                  ${CX},${htLE}
                  ${CX - htHalf},${htLE + htChord * 0.1}
                  ${CX - htHalf},${htTE - htChord * 0.1}
                  ${CX},${htTE}
                `}
                fill="rgba(34,197,94,0.10)"
                stroke="#22c55e"
                strokeWidth="1.2"
              />
              <polygon
                points={`
                  ${CX},${htLE}
                  ${CX + htHalf},${htLE + htChord * 0.1}
                  ${CX + htHalf},${htTE - htChord * 0.1}
                  ${CX},${htTE}
                `}
                fill="rgba(34,197,94,0.10)"
                stroke="#22c55e"
                strokeWidth="1.2"
              />
            </>
          )}

          {/* ── H-tail booms ── */}
          {isHTail && (
            <>
              <line x1={CX - halfSpanPx * 0.55} y1={wingTE} x2={CX - halfSpanPx * 0.55} y2={tailXCenter + htChord * 0.5} stroke="#22c55e" strokeWidth="1.2" />
              <line x1={CX + halfSpanPx * 0.55} y1={wingTE} x2={CX + halfSpanPx * 0.55} y2={tailXCenter + htChord * 0.5} stroke="#22c55e" strokeWidth="1.2" />
              {/* H-tail HT */}
              <line
                x1={CX - htHalf}
                y1={tailXCenter}
                x2={CX + htHalf}
                y2={tailXCenter}
                stroke="#22c55e"
                strokeWidth="2"
              />
            </>
          )}

          {/* ── Vertical tail ── */}
          {!isVTail && !isHTail && (
            <polygon
              points={`
                ${CX},${htLE - vtHeight * 0.6}
                ${CX - vtHeight * 0.3},${htLE}
                ${CX - vtHeight * 0.3},${htTE}
                ${CX},${htTE}
              `}
              fill="rgba(251,191,36,0.10)"
              stroke="#f59e0b"
              strokeWidth="1.2"
            />
          )}

          {/* ── V-tail ── */}
          {isVTail && (
            <>
              <line x1={CX} y1={tailXCenter} x2={CX - htHalf * 0.7} y2={tailXCenter - vtHeight * 0.3} stroke="#f59e0b" strokeWidth="1.5" />
              <line x1={CX} y1={tailXCenter} x2={CX + htHalf * 0.7} y2={tailXCenter - vtHeight * 0.3} stroke="#f59e0b" strokeWidth="1.5" />
              <line x1={CX} y1={tailXCenter} x2={CX - htHalf * 0.9} y2={tailXCenter + htChord * 0.5} stroke="#22c55e" strokeWidth="1.2" />
              <line x1={CX} y1={tailXCenter} x2={CX + htHalf * 0.9} y2={tailXCenter + htChord * 0.5} stroke="#22c55e" strokeWidth="1.2" />
            </>
          )}

          {/* ── T-tail top bar ── */}
          {isTTail && (
            <line
              x1={CX - htHalf * 0.5}
              y1={htLE - vtHeight * 0.6}
              x2={CX + htHalf * 0.5}
              y2={htLE - vtHeight * 0.6}
              stroke="#22c55e"
              strokeWidth="2"
            />
          )}

          {/* ── Prop disc (circle at nose) ── */}
          <circle
            cx={CX}
            cy={wingLE - tailArmPx * 0.25 - 8}
            r={halfSpanPx * 0.12}
            fill="none"
            stroke="#6b7280"
            strokeWidth="1"
            strokeDasharray="3 3"
          />

          {/* ── CG dot ── */}
          <circle cx={cgX} cy={cgY} r={5} fill={smColor} opacity="0.9" />
          <circle cx={cgX} cy={cgY} r={3} fill="#111827" />
          <text x={cgX + 8} y={cgY + 4} fill={smColor} fontSize="9" fontFamily="monospace">CG</text>

          {/* ── Span dimension line ── */}
          <line x1={CX - halfSpanPx} y1={wingLE - 10} x2={CX + halfSpanPx} y2={wingLE - 10} stroke="#374151" strokeWidth="1" markerStart="url(#arrow)" markerEnd="url(#arrow)" />
          <text x={CX} y={wingLE - 14} fill="#6b7280" fontSize="9" textAnchor="middle" fontFamily="monospace">
            b = {b.toFixed(2)} m
          </text>

          {/* ── Chord dimension line ── */}
          <line x1={CX + halfSpanPx + 8} y1={wingLE} x2={CX + halfSpanPx + 8} y2={wingTE} stroke="#374151" strokeWidth="1" />
          <text x={CX + halfSpanPx + 12} y={wingLE + chordPx / 2 + 4} fill="#6b7280" fontSize="9" fontFamily="monospace">
            c={c.toFixed(2)}
          </text>

          {/* ── Labels ── */}
          <text x={10} y={18} fill="#374151" fontSize="9" fontFamily="monospace">TOP VIEW</text>

          {/* ── Wing config badge ── */}
          {isBiplane && (
            <text x={CX} y={wingLE - 28} fill="#7c3aed" fontSize="9" textAnchor="middle" fontFamily="monospace">
              {wingConfigId === 'SESQUIPLANE' ? 'SESQUIPLANE' : 'BIPLANE'} — gap/c = {gapChordRatio.toFixed(2)}
            </text>
          )}

          {/* ── Efficiency score overlay ── */}
          {score != null && (
            <g>
              <rect x={W - 70} y={H - 36} width={62} height={28} rx="4" fill="#111827" stroke="#1f2937" />
              <text x={W - 39} y={H - 22} fill={scoreColor} fontSize="18" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
                {score}
              </text>
              <text x={W - 39} y={H - 10} fill="#6b7280" fontSize="7" textAnchor="middle" fontFamily="monospace">
                SCORE
              </text>
            </g>
          )}
        </svg>
      </div>

      {/* Bottom stats strip */}
      {result && !result.error && (
        <div className="flex-shrink-0 border-t border-gray-800 bg-gray-900 px-4 py-2 flex gap-6 overflow-x-auto">
          <StatChip label="AR" value={result.AR?.toFixed(2)} />
          <StatChip label="V_cruise" value={result.V_cruise != null ? `${result.V_cruise.toFixed(1)} m/s` : '—'} />
          <StatChip label="V_stall" value={result.V_stall != null ? `${result.V_stall.toFixed(1)} m/s` : '—'} warn={result.V_stall > 8} />
          <StatChip label="L/D" value={result.LD_ratio?.toFixed(1)} />
          <StatChip label="Fuse L" value={result.fuselageLength != null ? `${result.fuselageLength.toFixed(2)} m` : '—'} />
          <StatChip label="W_total" value={result.W_total != null ? `${(result.W_total * 1000).toFixed(0)} g` : '—'} />
        </div>
      )}
    </div>
  );
}

function StatChip({ label, value, warn }) {
  return (
    <div className="flex flex-col items-center flex-shrink-0">
      <span className="text-gray-600 text-xs">{label}</span>
      <span className={`text-xs font-bold tabular-nums ${warn ? 'text-yellow-400' : 'text-gray-300'}`}>{value ?? '—'}</span>
    </div>
  );
}
