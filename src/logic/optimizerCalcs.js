// Master design optimizer — ties every module together.
// Single entry point that takes a full config and returns a complete scorecard.

import { calcAero } from './aeroCalcs.js';
import { calcWingWeight, calcTailWeight, calcWeightBudget } from './weightCalcs.js';
import {
  calcBatteryWeight,
  calcStaticThrust,
  calcTWR,
  calcThrustRequired,
  calcThrustMargin,
  calcMaxPayload,
  calcEndurance,
} from './powerCalcs.js';
import { calcStallSpeed, calcRequiredCL, calcLiftToDrag, calcBestLDSpeed } from './liftCalcs.js';
import { calcFuselageLength, calcNoseArm, calcFuselageDragCoeff } from './fuselageCalcs.js';
import { calcBiplaneCLmax, calcBiplaneWingWeight } from './biplaneCalcs.js';
import { calcEfficiencyScore } from './efficiencyCalcs.js';

/**
 * Compute the complete design scorecard for any aircraft configuration.
 *
 * Inputs — Geometry:
 *   S                Wing reference area (m²) — total area for biplane (upper + lower)
 *   b                Wingspan (m) — upper wing span for biplane
 *   c                Mean aerodynamic chord (m)
 *   S_ht             Horizontal tail area (m²)
 *   S_vt             Vertical tail area (m²)
 *   L_ht             Horizontal tail moment arm (m)
 *   L_vt             Vertical tail moment arm (m)
 *   wingConfig       Object from wingConfigs.js
 *   gapChordRatio    Gap-to-chord ratio (biplane/sesquiplane only, default 1.0)
 *   fuselageWidth    Fuselage width (m), used for frontal drag
 *   fuselageHeight   Fuselage height (m)
 *
 * Inputs — Aerodynamics:
 *   airfoil          Airfoil object from airfoils.js
 *   tailConfig       Tail config object from tailConfigs.js
 *   dihedralAngle    V-tail panel dihedral (degrees), ignored for other configs
 *   flaperonsEnabled Boolean
 *   h_cg             CG position as fraction of MAC (0 = LE, typical 0.25–0.35)
 *   aoa              Current angle of attack (degrees)
 *   rho              Air density (kg/m³), default sea level
 *
 * Inputs — Power:
 *   motor            Motor object from motors.js
 *   batteryS         Cell count (e.g. 3 for 3S LiPo)
 *   batteryCapacityMAh  Pack capacity in mAh
 *   throttleFraction Cruise throttle fraction (0–1)
 *   manualThrustG    Override thrust in grams (for CUSTOM motor, overrides motor.maxThrustG)
 *
 * Inputs — Materials & Weight:
 *   wingMaterial     Material object from materials.js
 *   tailMaterial     Material object from materials.js
 *   payloadKg        Target payload mass (kg)
 *   electronicsWeightG  ESC + receiver + servos (g), default 150
 *   fuselageWeightG  Estimated fuselage mass (g), default 200
 *
 * Returns: full scorecard object (see return statement below).
 */
export function calcOptimizedDesign({
  // Geometry
  S, b, c,
  S_ht, S_vt, L_ht, L_vt,
  wingConfig,
  gapChordRatio = 1.0,
  fuselageWidth = 0.12,
  fuselageHeight = 0.12,

  // Aerodynamics
  airfoil, tailConfig,
  dihedralAngle = 0,
  flaperonsEnabled = false,
  h_cg = 0.30,
  aoa = 5,
  rho = 1.225,

  // Power
  motor = null,
  batteryS = 3,
  batteryCapacityMAh = 2200,
  throttleFraction = 1.0,
  manualThrustG = null,

  // Materials & weight
  wingMaterial,
  tailMaterial,
  payloadKg,
  electronicsWeightG = 150,
  fuselageWeightG = 200,
}) {
  // ─── Step 1: Biplane CL_max adjustment ──────────────────────────────────────
  // For biplane/sesquiplane, S is the total area (both wings combined).
  // CL_max is reduced by Munck interference; AR is based on upper wing (b²/(S/2)).
  const isBiplane = wingConfig.id === 'BIPLANE' || wingConfig.id === 'SESQUIPLANE';
  const CL_max_eff = isBiplane
    ? calcBiplaneCLmax(airfoil.CL_max, wingConfig.liftInterferenceFactor, gapChordRatio)
    : airfoil.CL_max;

  // ─── Step 2: Aerodynamic stability (tail volumes, NP, static margin) ────────
  const aeroResult = calcAero({
    S, b, c,
    S_ht, S_vt, L_ht, L_vt,
    airfoil, tailConfig,
    dihedralAngle, flaperonsEnabled,
    h_cg, aoa,
  });
  const { V_ht, V_vt, AR, h_n, staticMargin, stabilityStatus, stallRisk, scissorsData } = aeroResult;

  // ─── Step 3: Weight budget ───────────────────────────────────────────────────
  const W_motor_kg = (motor?.weightG ?? 0) / 1000;
  const W_battery_kg = calcBatteryWeight(batteryS, batteryCapacityMAh);
  const W_electronics_kg = electronicsWeightG / 1000;
  const W_fuselage_kg = fuselageWeightG / 1000;

  // Wing structural weight — biplane penalty applies because of struts/bracing
  const W_wing_mono = calcWingWeight(S, wingMaterial);
  const W_wing_kg = isBiplane
    ? calcBiplaneWingWeight(W_wing_mono, wingConfig.structuralWeightFactor)
    : W_wing_mono;

  const W_tail_kg = calcTailWeight(S_ht, S_vt, tailMaterial);

  const { W_total_kg, W_empty_kg, payloadFraction } = calcWeightBudget({
    W_wing_kg,
    W_tail_kg,
    W_fuselage_kg,
    W_motor_kg,
    W_battery_kg,
    W_electronics_kg,
    W_payload_kg: payloadKg,
  });

  // ─── Step 4: Thrust and power ────────────────────────────────────────────────
  const thrustStaticG = calcStaticThrust(motor, throttleFraction, manualThrustG);
  const TWR = calcTWR(thrustStaticG, W_total_kg);

  // ─── Step 5: Lift performance ────────────────────────────────────────────────
  const V_stall = calcStallSpeed(W_total_kg, S, CL_max_eff, rho);
  const V_bestLD = calcBestLDSpeed(W_total_kg, S, AR, rho);
  const V_cruise = V_bestLD; // cruise at best L/D for max efficiency
  const CL_required = calcRequiredCL(W_total_kg, V_cruise, S, rho);
  const LD_ratio = calcLiftToDrag(CL_required, AR);

  // ─── Step 6: Thrust requirements ────────────────────────────────────────────
  const thrustRequiredG = calcThrustRequired(W_total_kg, LD_ratio);
  const thrustMarginG = calcThrustMargin(thrustStaticG, thrustRequiredG);
  const maxPayloadKg = calcMaxPayload(thrustStaticG, W_empty_kg);
  const enduranceMin = calcEndurance(batteryCapacityMAh, thrustRequiredG, motor, batteryS, manualThrustG);

  // ─── Step 7: Fuselage geometry ───────────────────────────────────────────────
  const fuselageLength = calcFuselageLength(L_ht, c);
  const noseArm = calcNoseArm(fuselageLength);
  const CD_fuse = calcFuselageDragCoeff(fuselageWidth, fuselageHeight, S);

  // ─── Step 8: Efficiency score ────────────────────────────────────────────────
  const { score: efficiencyScore, penalties: penaltyBreakdown } = calcEfficiencyScore({
    payloadFraction,
    LD_ratio,
    thrustMarginG,
    W_total_kg,
    staticMargin,
    V_stall,
    V_ht,
    V_vt,
    TWR,
    tailConfigId: tailConfig.id,
  });

  // ─── Step 9: Aggregate all warnings (aero + power/weight) ───────────────────
  const activeWarnings = [...aeroResult.activeWarnings];

  if (TWR < 0.3) {
    activeWarnings.push({
      code: 'TWR_LOW',
      message: `TWR = ${TWR.toFixed(3)} is below 0.3 — insufficient thrust to climb.`,
      severity: 'critical',
    });
  } else if (TWR < 0.5) {
    activeWarnings.push({
      code: 'TWR_MARGINAL',
      message: `TWR = ${TWR.toFixed(3)} is marginal (0.3–0.5). May struggle on warm-day or uphill takeoffs.`,
      severity: 'warning',
    });
  }

  if (payloadFraction < 0.25) {
    activeWarnings.push({
      code: 'PAYLOAD_FRACTION_LOW',
      message: `Payload fraction = ${(payloadFraction * 100).toFixed(1)}% is below 25%. Consider lighter materials or a smaller motor.`,
      severity: 'warning',
    });
  }

  if (V_stall > 8) {
    activeWarnings.push({
      code: 'STALL_SPEED_HIGH',
      message: `Stall speed = ${V_stall.toFixed(1)} m/s exceeds the 8 m/s hand/bungee-launch limit.`,
      severity: 'warning',
    });
  }

  if (thrustMarginG < 0) {
    activeWarnings.push({
      code: 'THRUST_MARGIN_NEG',
      message: `Thrust margin = ${thrustMarginG.toFixed(0)} g. Motor cannot sustain level flight at this weight.`,
      severity: 'critical',
    });
  }

  if (fuselageLength < L_ht + 0.10) {
    activeWarnings.push({
      code: 'FUSELAGE_TOO_SHORT',
      message: `Fuselage length (${fuselageLength.toFixed(2)} m) leaves < 10 cm ahead of the tail arm — motor, battery, and CG balance require at least ${(L_ht + 0.10).toFixed(2)} m.`,
      severity: 'critical',
    });
  }

  if (isBiplane && gapChordRatio < 0.8) {
    activeWarnings.push({
      code: 'BIPLANE_GAP_LOW',
      message: `Gap/chord = ${gapChordRatio.toFixed(2)} is below 0.8 — excessive biplane interference reduces effective CL_max.`,
      severity: 'warning',
    });
  }

  return {
    // Aero (from aeroCalcs.js)
    V_ht, V_vt, AR, h_n, staticMargin, stabilityStatus, stallRisk,

    // Weight
    W_wing: W_wing_kg,
    W_tail: W_tail_kg,
    W_total: W_total_kg,
    W_empty: W_empty_kg,
    payloadFraction,

    // Power
    thrustStatic: thrustStaticG,
    thrustRequired: thrustRequiredG,
    thrustMargin: thrustMarginG,
    TWR,
    enduranceMin,
    maxPayloadKg,

    // Aero performance
    LD_ratio,
    V_stall,
    V_cruise,
    V_bestLD,
    CL_required,

    // Fuselage
    fuselageLength,
    noseArm,
    CD_fuse,

    // Score
    efficiencyScore,
    penaltyBreakdown,

    // All warnings (aero + power/weight)
    activeWarnings,

    // Scissors diagram (for UI)
    scissorsData,
  };
}
