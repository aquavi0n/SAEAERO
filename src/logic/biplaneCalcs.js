// Biplane aerodynamic calculations — pure functions, no side effects.
// Based on Munck's mutual induction / biplane interference theory.

/**
 * Effective CL_max for a biplane configuration.
 *
 * Munck's gap correction: a larger gap/chord ratio reduces interference loss.
 *   CL_max_bi = CL_max_single × liftInterferenceFactor × (1 + gapChordRatio × 0.1)
 *
 * Typical SAE Aero gap/chord = 1.0–1.5.
 * At gap/chord = 1.0 and interference = 0.85: effective CL ≈ 0.935 × CL_max_single.
 */
export function calcBiplaneCLmax(CL_max_single, liftInterferenceFactor, gapChordRatio) {
  return CL_max_single * liftInterferenceFactor * (1 + gapChordRatio * 0.1);
}

/**
 * Total biplane wing reference area.
 */
export function calcBiplaneTotalArea(S_upper, S_lower) {
  return S_upper + S_lower;
}

/**
 * Effective monoplane-equivalent area for drag calculations.
 * Biplane interference raises effective drag by ~10% over an equal-area monoplane.
 *   S_equiv = S_total × 0.90
 */
export function calcBiplaneEquivArea(S_total) {
  return S_total * 0.90;
}

/**
 * Biplane wing structural weight — heavier than monoplane due to
 * inter-plane struts, bracing wires, and additional fittings.
 *   W_bi = W_mono × structuralWeightFactor  (~1.25–1.35×)
 */
export function calcBiplaneWingWeight(W_wing_mono, structuralWeightFactor) {
  return W_wing_mono * structuralWeightFactor;
}

/**
 * Side-by-side comparison of biplane vs monoplane for the same total wing area.
 *
 * Assumes the biplane splits that area equally between upper and lower wings.
 * Returns an object with the key metrics for each configuration so the caller
 * can pick the winner given their span constraint and payload target.
 */
export function compareBiplaneVsMonoplane({
  CL_max_mono,
  S_mono,
  W_wing_mono,
  gapChordRatio = 1.0,
  liftInterferenceFactor = 0.85,
  dragPenaltyFactor = 1.10,
  structuralWeightFactor = 1.30,
}) {
  const S_upper = S_mono / 2;
  const S_lower = S_mono / 2;
  const S_total = calcBiplaneTotalArea(S_upper, S_lower);
  const S_equiv = calcBiplaneEquivArea(S_total);
  const CL_max_biplane = calcBiplaneCLmax(CL_max_mono, liftInterferenceFactor, gapChordRatio);
  const W_wing_biplane = calcBiplaneWingWeight(W_wing_mono, structuralWeightFactor);

  return {
    monoplane: {
      CL_max: CL_max_mono,
      S_wing: S_mono,
      W_wing: W_wing_mono,
      dragPenaltyFactor: 1.0,
    },
    biplane: {
      CL_max: CL_max_biplane,
      S_total,
      S_equiv,
      W_wing: W_wing_biplane,
      dragPenaltyFactor,
    },
  };
}
