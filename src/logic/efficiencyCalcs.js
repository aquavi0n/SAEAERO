// Overall design efficiency scoring — pure functions, no side effects.

/**
 * Linearly normalize a value into [0, 1] given expected min/max bounds.
 * Values outside the range are clamped.
 */
function normalize(value, min, max) {
  if (max === min) return 0;
  return Math.max(0, Math.min(1, (value - min) / (max - min)));
}

/**
 * Compute the 0–100 overall efficiency score for a design.
 *
 * Weighted composite (weights sum to 1.0):
 *   0.35 × payloadFraction       (most important — payload is the mission)
 *   0.25 × L/D ratio             (aerodynamic efficiency)
 *   0.20 × thrust margin fraction (climb/acceleration reserve)
 *   0.10 × static margin         (stability quality)
 *   0.10 × inverse stall risk    (safety margin above stall)
 *
 * Penalty deductions are applied after the weighted score is computed.
 *
 * Inputs:
 *   payloadFraction     — W_payload / W_total (0–1)
 *   LD_ratio            — L/D at cruise
 *   thrustMarginG       — surplus thrust in grams (can be negative)
 *   W_total_kg          — total aircraft weight
 *   staticMargin        — fraction of MAC (can be negative = unstable)
 *   V_stall             — stall speed m/s (higher = worse for hand launch)
 *   V_ht, V_vt          — tail volume coefficients
 *   TWR                 — thrust-to-weight ratio
 *   tailConfigId        — tail config id string (T_TAIL gets a risk penalty)
 *
 * Returns { score: number (0–100), penalties: Array<{ code, points }> }
 */
export function calcEfficiencyScore({
  payloadFraction,
  LD_ratio,
  thrustMarginG,
  W_total_kg,
  staticMargin,
  V_stall,
  V_ht,
  V_vt,
  TWR,
  tailConfigId,
}) {
  // thrustMarginFraction: excess thrust as a fraction of aircraft weight
  const thrustMarginFraction = thrustMarginG / (W_total_kg * 1000);

  // stallSpeedRisk: 0 = safe (V_stall << 8 m/s), 1 = high risk (V_stall >= 10 m/s)
  const stallSpeedRisk = normalize(V_stall, 0, 10);

  const base =
    0.35 * normalize(payloadFraction, 0.2, 0.6) +
    0.25 * normalize(LD_ratio, 5, 20) +
    0.20 * normalize(thrustMarginFraction, 0, 0.5) +
    0.10 * normalize(staticMargin, 0.05, 0.20) +
    0.10 * normalize(1 - stallSpeedRisk, 0, 1);

  let score = base * 100;
  const penalties = [];

  if (V_ht < 0.4) {
    score -= 20;
    penalties.push({ code: 'VHT_LOW', points: -20 });
  }
  if (V_vt < 0.02) {
    score -= 20;
    penalties.push({ code: 'VVT_LOW', points: -20 });
  }
  if (TWR < 0.3) {
    score -= 30;
    penalties.push({ code: 'TWR_CRITICAL', points: -30 });
  }
  if (staticMargin < 0) {
    score -= 40;
    penalties.push({ code: 'UNSTABLE', points: -40 });
  }
  if (payloadFraction < 0.25) {
    score -= 15;
    penalties.push({ code: 'PAYLOAD_FRACTION_LOW', points: -15 });
  }
  if (tailConfigId === 'T_TAIL') {
    score -= 5;
    penalties.push({ code: 'T_TAIL', points: -5 });
  }

  return {
    score: Math.max(0, Math.min(100, score)),
    penalties,
  };
}
