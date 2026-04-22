// Lift performance calculations — pure functions, no side effects.
// All speeds in m/s, areas in m², weights in kg, forces in N unless noted.

const RHO_SL = 1.225; // kg/m³ — sea level standard atmosphere
const G = 9.81;       // m/s²
const CD0 = 0.025;    // parasite drag coefficient (SAE Aero typical: fuselage + landing gear)
const E_OSWALD = 0.80; // Oswald efficiency factor (typical SAE build quality)

/**
 * Wing area required to achieve level flight at V_cruise with a given CL.
 *   S = 2·W·g / (ρ·V²·CL)
 */
export function calcRequiredWingArea(W_total_kg, V_cruise_ms, CL, rho = RHO_SL) {
  return (2 * W_total_kg * G) / (rho * V_cruise_ms ** 2 * CL);
}

/**
 * Stall speed — minimum airspeed at which the wing generates enough lift.
 *   V_stall = sqrt(2·W·g / (ρ·CL_max·S))
 */
export function calcStallSpeed(W_total_kg, S, CL_max, rho = RHO_SL) {
  return Math.sqrt((2 * W_total_kg * G) / (rho * CL_max * S));
}

/**
 * CL required to sustain level flight at a given speed.
 *   CL = 2·W·g / (ρ·V²·S)
 */
export function calcRequiredCL(W_total_kg, V_ms, S, rho = RHO_SL) {
  return (2 * W_total_kg * G) / (rho * V_ms ** 2 * S);
}

/**
 * Total drag coefficient using the parabolic drag polar.
 *   CD = CD0 + CL² / (π·e·AR)
 */
export function calcCD(CL, AR) {
  return CD0 + CL ** 2 / (Math.PI * E_OSWALD * AR);
}

/**
 * Lift-to-drag ratio at a given CL and AR.
 */
export function calcLiftToDrag(CL, AR) {
  return CL / calcCD(CL, AR);
}

/**
 * Speed at which L/D is maximum (best range / cruise speed).
 *
 * At max L/D, induced drag = parasite drag:
 *   CL_opt = sqrt(π·e·AR·CD0)
 *   V_bestLD = sqrt(2·W·g / (ρ·S·CL_opt))
 *
 * Higher AR → higher CL_opt → lower V_bestLD (more efficient wing flown slower).
 */
export function calcBestLDSpeed(W_total_kg, S, AR, rho = RHO_SL) {
  const CL_opt = Math.sqrt(Math.PI * E_OSWALD * AR * CD0);
  return Math.sqrt((2 * W_total_kg * G) / (rho * S * CL_opt));
}

/**
 * The CL at which L/D is maximum.
 *   CL_bestLD = sqrt(π·e·AR·CD0)
 */
export function calcBestLDCL(AR) {
  return Math.sqrt(Math.PI * E_OSWALD * AR * CD0);
}

/**
 * Maximum achievable L/D ratio for a given AR.
 *   (L/D)_max = CL_opt / (2·CD0) = sqrt(π·e·AR / (4·CD0))
 */
export function calcMaxLD(AR) {
  return Math.sqrt((Math.PI * E_OSWALD * AR) / (4 * CD0));
}
