// Power system calculations — pure functions, no side effects.
// Thrust values in grams-force (g); mass in kg; times in minutes.

const CELL_VOLTAGE_V = 3.7;    // nominal LiPo cell voltage
const TWR_TARGET_DEFAULT = 0.5; // minimum acceptable thrust-to-weight ratio for SAE Aero

/**
 * Nominal battery pack voltage.
 *   V_bat = batteryS × 3.7 V
 */
export function calcBatteryVoltage(batteryS) {
  return batteryS * CELL_VOLTAGE_V;
}

/**
 * Battery weight estimate.
 *   ~8 g/Wh for small LiPo packs (empirical average across common SAE sizes)
 *   W_battery_kg = 8 g/Wh × (batteryS × 3.7 V × capacityMAh / 1000 Ah) / 1000 g/kg
 */
export function calcBatteryWeight(batteryS, batteryCapacityMAh) {
  const whCapacity = batteryS * CELL_VOLTAGE_V * (batteryCapacityMAh / 1000);
  return (whCapacity * 8) / 1000; // kg
}

/**
 * Static thrust at a given throttle.
 *   If manualThrustG is provided it overrides motor.maxThrustG (for CUSTOM motor entry).
 */
export function calcStaticThrust(motor, throttleFraction = 1.0, manualThrustG = null) {
  const base = manualThrustG !== null ? manualThrustG : motor.maxThrustG;
  return base * throttleFraction;
}

/**
 * Thrust-to-weight ratio (dimensionless).
 *   TWR = T_N / W_N = thrustG / (W_total_kg × 1000)
 *
 * Target ≥ 0.5 for SAE Aero (slow takeoff).
 * < 0.3 → cannot climb.  > 1.0 → overkill, wasting payload budget.
 */
export function calcTWR(thrustG, W_total_kg) {
  return thrustG / (W_total_kg * 1000);
}

/**
 * Thrust required for level flight = drag force.
 *   T_req (g) = W_total (g) / (L/D) = W_total_kg × 1000 / LD_ratio
 */
export function calcThrustRequired(W_total_kg, LD_ratio) {
  return (W_total_kg * 1000) / LD_ratio;
}

/**
 * Remaining thrust after overcoming cruise drag.
 *   thrustMargin > 0 → can climb / accelerate
 *   thrustMargin < 0 → cannot sustain level flight at this weight
 */
export function calcThrustMargin(thrustStaticG, thrustRequiredG) {
  return thrustStaticG - thrustRequiredG;
}

/**
 * Maximum liftable payload given static thrust and empty weight.
 *   W_total_max = thrustG / (TWR_target × 1000)
 *   maxPayload   = W_total_max - W_empty_kg
 *
 * Returns a negative value if the motor cannot even lift the empty aircraft
 * at the target TWR — a useful signal to the user.
 */
export function calcMaxPayload(thrustStaticG, W_empty_kg, TWR_target = TWR_TARGET_DEFAULT) {
  const W_total_max_kg = thrustStaticG / (TWR_target * 1000);
  return W_total_max_kg - W_empty_kg;
}

/**
 * Estimated flight endurance in minutes.
 *
 * Uses the prop-law approximation: P ∝ T^(3/2), so
 *   I_cruise ≈ I_max × (T_req / T_max)^(3/2)
 *
 * Returns null when the motor database entry lacks current/thrust data
 * (CUSTOM motor without manualThrustG, or thrustRequired = 0).
 */
export function calcEndurance(batteryCapacityMAh, thrustRequiredG, motor, batteryS, manualThrustG = null) {
  const maxThrustG = manualThrustG !== null ? manualThrustG : motor?.maxThrustG;
  const maxCurrentA = motor?.maxCurrentA;
  if (!maxCurrentA || !maxThrustG || thrustRequiredG <= 0) return null;

  const I_cruise = maxCurrentA * Math.pow(thrustRequiredG / maxThrustG, 1.5);
  return (batteryCapacityMAh / 1000 / I_cruise) * 60; // minutes
}
