// All aerodynamic calculations — pure functions, no side effects.
// Angles in degrees at the API boundary; converted to radians internally.

// ─── Tail Volume Coefficients ─────────────────────────────────────────────────

/**
 * Horizontal tail volume coefficient.
 * V_ht = (S_ht * L_ht) / (S * c)
 */
export function calcVht(S_ht, L_ht, S, c) {
  return (S_ht * L_ht) / (S * c);
}

/**
 * Vertical tail volume coefficient.
 * V_vt = (S_vt * L_vt) / (S * b)
 */
export function calcVvt(S_vt, L_vt, S, b) {
  return (S_vt * L_vt) / (S * b);
}

/**
 * For a V-tail the same panels contribute to both pitch and yaw control.
 * The dihedral angle splits the lift into horizontal and vertical components:
 *   V_ht_eff = V_ht * cos²(Γ)
 *   V_vt_eff = V_vt * sin²(Γ)
 * where Γ is the dihedral half-angle from horizontal.
 */
export function calcVtailEffectiveVolumes(S_panel, L_ht, L_vt, S, c, b, dihedralDeg) {
  const gamma = (dihedralDeg * Math.PI) / 180;
  const cos2 = Math.cos(gamma) ** 2;
  const sin2 = Math.sin(gamma) ** 2;
  return {
    V_ht: calcVht(S_panel, L_ht, S, c) * cos2,
    V_vt: calcVvt(S_panel, L_vt, S, b) * sin2,
  };
}

// ─── Geometry ─────────────────────────────────────────────────────────────────

/** Aspect ratio from span and area. */
export function calcAspectRatio(b, S) {
  return (b * b) / S;
}

// ─── Neutral Point ────────────────────────────────────────────────────────────

/**
 * Neutral point position as a fraction of MAC from the leading edge.
 * Uses the standard tail-contribution formula:
 *
 *   h_n = h_ac + η_t * (a_t/a_w) * (1 - dε/dα) * V_ht * modifier
 *
 * Simplified assumptions:
 *   h_ac  = 0.25  (quarter-chord aerodynamic center, thin airfoil theory)
 *   η_t   = 0.90  (tail dynamic pressure efficiency)
 *   a_t/a_w = 0.90  (tail-to-wing lift curve slope ratio)
 *   dε/dα ≈ 2/(π·AR)  (Prandtl lifting-line downwash gradient)
 *
 * modifier comes from tailConfig (e.g. T-tail endplate effect).
 */
export function calcNeutralPoint(V_ht, AR, tailModifier = 1.0) {
  const h_ac = 0.25;
  const eta_t = 0.9;
  const liftSlopeRatio = 0.9;
  const downwashGradient = 2 / (Math.PI * AR);
  return h_ac + eta_t * liftSlopeRatio * (1 - downwashGradient) * V_ht * tailModifier;
}

// ─── Static Margin ────────────────────────────────────────────────────────────

/**
 * Static margin as a fraction of MAC.
 * Positive = stable (CG ahead of NP).
 * h_cg is the CG position as a fraction of MAC from the leading edge.
 */
export function calcStaticMargin(h_n, h_cg) {
  return h_n - h_cg;
}

// ─── Stability Classification ─────────────────────────────────────────────────

/**
 * Stability status based on static margin thresholds.
 * < 0      → unstable
 * 0–5%     → marginal (flyable but sensitive)
 * ≥ 5%     → stable
 */
export function getStabilityStatus(staticMargin) {
  if (staticMargin < 0) return 'unstable';
  if (staticMargin < 0.05) return 'marginal';
  return 'stable';
}

// ─── Stall Risk ───────────────────────────────────────────────────────────────

/**
 * Stall risk based on current AOA vs airfoil stall angle.
 * Returns one of: 'low' | 'moderate' | 'high' | 'stalled'
 */
export function getStallRisk(airfoil, aoa) {
  const ratio = aoa / airfoil.stallAngle;
  if (ratio >= 1.0) return 'stalled';
  if (ratio >= 0.85) return 'high';
  if (ratio >= 0.70) return 'moderate';
  return 'low';
}

// ─── Warnings ─────────────────────────────────────────────────────────────────

/**
 * Aggregate all active warnings from the current design state.
 * Each warning: { code, message, severity: 'critical' | 'warning' | 'info' }
 */
export function getActiveWarnings({ V_ht, V_vt, tailConfig, staticMargin, airfoil, flaperonsEnabled }) {
  const warnings = [];

  if (V_ht < 0.4) {
    warnings.push({
      code: 'VHT_LOW',
      message: `V_ht = ${V_ht.toFixed(3)} is below 0.4 — horizontal tail is undersized for adequate pitch stability.`,
      severity: 'critical',
    });
  }

  if (V_vt < 0.02) {
    warnings.push({
      code: 'VVT_LOW',
      message: `V_vt = ${V_vt.toFixed(3)} is below 0.02 — vertical tail is undersized for adequate directional stability.`,
      severity: 'critical',
    });
  }

  if (staticMargin < 0) {
    warnings.push({
      code: 'CG_AFT_NP',
      message: `CG is aft of the neutral point (SM = ${(staticMargin * 100).toFixed(1)}%). Aircraft is statically unstable.`,
      severity: 'critical',
    });
  }

  if (tailConfig.id === 'T_TAIL') {
    warnings.push({
      code: 'T_TAIL_DEEP_STALL',
      message: tailConfig.warnings[0],
      severity: 'warning',
    });
  }

  if (airfoil.warningText) {
    warnings.push({
      code: 'AIRFOIL_WARNING',
      message: airfoil.warningText,
      severity: 'warning',
    });
  }

  if (flaperonsEnabled) {
    warnings.push({
      code: 'FLAPERONS_COMPLEXITY',
      message: 'Flaperons add mechanical complexity. Verify differential mixing and verify no binding at full deflection.',
      severity: 'info',
    });
  }

  tailConfig.warnings.forEach((msg, i) => {
    if (tailConfig.id !== 'T_TAIL') {
      warnings.push({ code: `TAIL_WARNING_${i}`, message: msg, severity: 'warning' });
    }
  });

  return warnings;
}

// ─── Scissors Diagram Data ────────────────────────────────────────────────────

/**
 * Generate data for the scissors diagram: NP and (NP - SM_min) plotted as
 * a function of V_ht, letting the user see where their design sits.
 *
 * Returns an array of { V_ht, NP, CGlimit } objects over the given range.
 * CGlimit is the most-aft allowable CG position for the minimum static margin.
 */
export function generateScissorsDiagramData({ AR, tailModifier = 1.0, minStaticMargin = 0.05, steps = 50 }) {
  const V_ht_min = 0.1;
  const V_ht_max = 1.2;
  const step = (V_ht_max - V_ht_min) / (steps - 1);

  return Array.from({ length: steps }, (_, i) => {
    const V_ht = V_ht_min + i * step;
    const NP = calcNeutralPoint(V_ht, AR, tailModifier);
    const CGlimit = NP - minStaticMargin;
    return { V_ht: +V_ht.toFixed(4), NP: +NP.toFixed(4), CGlimit: +CGlimit.toFixed(4) };
  });
}

// ─── Master Calculation ───────────────────────────────────────────────────────

/**
 * Single entry point that takes all design inputs and returns all derived values.
 *
 * Inputs:
 *   S          Wing area (m²)
 *   b          Wingspan (m)
 *   c          Mean aerodynamic chord (m)
 *   S_ht       Horizontal tail area (m²) — or total V-tail panel area per side
 *   S_vt       Vertical tail area (m²)
 *   L_ht       Horizontal tail moment arm (m)
 *   L_vt       Vertical tail moment arm (m)
 *   airfoil    Airfoil object from airfoils.js
 *   tailConfig Tail config object from tailConfigs.js
 *   dihedralAngle  V-tail dihedral angle (degrees) — only used when V-tail selected
 *   flaperonsEnabled Boolean
 *   h_cg       CG position as fraction of MAC (0 = LE, 1 = TE, typically 0.25–0.35)
 *   aoa        Current angle of attack (degrees)
 *
 * Returns: { V_ht, V_vt, AR, h_n, staticMargin, stabilityStatus, stallRisk, activeWarnings, scissorsData }
 */
export function calcAero({
  S, b, c,
  S_ht, S_vt, L_ht, L_vt,
  airfoil, tailConfig,
  dihedralAngle = 0,
  flaperonsEnabled = false,
  h_cg = 0.30,
  aoa = 5,
}) {
  const AR = calcAspectRatio(b, S);

  let V_ht, V_vt;
  if (tailConfig.id === 'V_TAIL') {
    // For V-tail, S_ht is treated as the total panel area contributing to both axes.
    // L_ht and L_vt may differ if the V-tail is swept, but typically L_ht ≈ L_vt.
    const eff = calcVtailEffectiveVolumes(S_ht, L_ht, L_vt, S, c, b, dihedralAngle);
    V_ht = eff.V_ht;
    V_vt = eff.V_vt;
  } else {
    V_ht = calcVht(S_ht, L_ht, S, c);
    V_vt = calcVvt(S_vt, L_vt, S, b);
  }

  const h_n = calcNeutralPoint(V_ht, AR, tailConfig.modifier);
  const staticMargin = calcStaticMargin(h_n, h_cg);
  const stabilityStatus = getStabilityStatus(staticMargin);
  const stallRisk = getStallRisk(airfoil, aoa);
  const activeWarnings = getActiveWarnings({ V_ht, V_vt, tailConfig, staticMargin, airfoil, flaperonsEnabled });
  const scissorsData = generateScissorsDiagramData({ AR, tailModifier: tailConfig.modifier });

  return {
    V_ht,
    V_vt,
    AR,
    h_n,
    staticMargin,
    stabilityStatus,
    stallRisk,
    activeWarnings,
    scissorsData,
  };
}
