// Weight budget calculations — pure functions, no side effects.
// All weights in kg.

// Wing weight = skin area × surface density × structural factor.
// Factor 2.2 accounts for spar, ribs, covering, and adhesive beyond just skin.
const STRUCTURAL_FACTOR_WING = 2.2;

// Tail surfaces are less loaded and built lighter (factor 1.5).
const STRUCTURAL_FACTOR_TAIL = 1.5;

/**
 * Estimated wing structural weight in kg.
 *   W_wing = S_total × material.densityKgM2 × 2.2
 */
export function calcWingWeight(S_total_m2, material) {
  return S_total_m2 * material.densityKgM2 * STRUCTURAL_FACTOR_WING;
}

/**
 * Estimated horizontal + vertical tail structural weight in kg.
 *   W_tail = (S_ht + S_vt) × material.densityKgM2 × 1.5
 */
export function calcTailWeight(S_ht_m2, S_vt_m2, material) {
  return (S_ht_m2 + S_vt_m2) * material.densityKgM2 * STRUCTURAL_FACTOR_TAIL;
}

/**
 * Full weight budget.
 * Returns { W_total_kg, W_empty_kg, payloadFraction }.
 *
 * W_electronics_kg defaults to 150 g (ESC + receiver + servos) if not provided.
 */
export function calcWeightBudget({
  W_wing_kg,
  W_tail_kg,
  W_fuselage_kg,
  W_motor_kg,
  W_battery_kg,
  W_electronics_kg = 0.150,
  W_payload_kg,
}) {
  const W_total_kg =
    W_wing_kg +
    W_tail_kg +
    W_fuselage_kg +
    W_motor_kg +
    W_battery_kg +
    W_electronics_kg +
    W_payload_kg;
  const W_empty_kg = W_total_kg - W_payload_kg;
  const payloadFraction = W_payload_kg / W_total_kg;
  return { W_total_kg, W_empty_kg, payloadFraction };
}

/**
 * Payload fraction = payload weight / total weight.
 * Competitive SAE Aero designs target 40–60%.
 */
export function calcPayloadFraction(W_payload_kg, W_total_kg) {
  return W_payload_kg / W_total_kg;
}

/**
 * Structural efficiency = payload weight / empty weight.
 * Measures how well the structure is being exploited.
 * Good SAE designs: 0.8–1.5.
 */
export function calcStructuralEfficiency(W_payload_kg, W_empty_kg) {
  return W_payload_kg / W_empty_kg;
}
