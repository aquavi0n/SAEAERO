import { describe, it, expect } from 'vitest';
import { getAirfoilById } from '../data/airfoils.js';
import { getTailConfigById } from '../data/tailConfigs.js';
import { getMaterialById } from '../data/materials.js';
import { getMotorById } from '../data/motors.js';
import { getWingConfigById } from '../data/wingConfigs.js';
import { calcOptimizedDesign } from '../logic/optimizerCalcs.js';

// ─── Baseline inputs ──────────────────────────────────────────────────────────
// Physically plausible SAE Aero design: ~1.2 kg total, 1050 g thrust, good L/D

const baseline = {
  S: 0.9, b: 2.4, c: 0.375,
  S_ht: 0.18, S_vt: 0.07,
  L_ht: 0.85, L_vt: 0.85,
  wingConfig: getWingConfigById('MONOPLANE'),
  gapChordRatio: 1.0,
  fuselageWidth: 0.12,
  fuselageHeight: 0.12,
  airfoil: getAirfoilById('NACA_4412'),
  tailConfig: getTailConfigById('CONVENTIONAL'),
  dihedralAngle: 0,
  flaperonsEnabled: false,
  h_cg: 0.30,
  aoa: 5,
  rho: 1.225,
  motor: getMotorById('SUNNYSKY_X2216'),
  batteryS: 3,
  batteryCapacityMAh: 2200,
  throttleFraction: 1.0,
  manualThrustG: null,
  wingMaterial: getMaterialById('BALSA_3MM'),
  tailMaterial: getMaterialById('BALSA_3MM'),
  payloadKg: 0.5,
  electronicsWeightG: 150,
  fuselageWeightG: 200,
};

// ─── Output schema ────────────────────────────────────────────────────────────

describe('calcOptimizedDesign — output schema', () => {
  const result = calcOptimizedDesign(baseline);

  const expectedKeys = [
    'V_ht', 'V_vt', 'AR', 'h_n', 'staticMargin', 'stabilityStatus', 'stallRisk',
    'W_wing', 'W_tail', 'W_total', 'W_empty', 'payloadFraction',
    'thrustStatic', 'thrustRequired', 'thrustMargin', 'TWR', 'enduranceMin', 'maxPayloadKg',
    'LD_ratio', 'V_stall', 'V_cruise', 'V_bestLD', 'CL_required',
    'fuselageLength', 'noseArm', 'CD_fuse',
    'efficiencyScore', 'penaltyBreakdown',
    'activeWarnings', 'scissorsData',
  ];

  expectedKeys.forEach((key) => {
    it(`returns key: ${key}`, () => {
      expect(result).toHaveProperty(key);
    });
  });
});

// ─── Physics sanity checks ────────────────────────────────────────────────────

describe('calcOptimizedDesign — physics', () => {
  const result = calcOptimizedDesign(baseline);

  it('AR is b²/S', () => {
    expect(result.AR).toBeCloseTo(baseline.b ** 2 / baseline.S, 4);
  });

  it('W_total = W_wing + W_tail + other components', () => {
    expect(result.W_total).toBeGreaterThan(result.W_wing + result.W_tail);
  });

  it('W_empty = W_total - payload', () => {
    expect(result.W_empty).toBeCloseTo(result.W_total - baseline.payloadKg, 4);
  });

  it('payloadFraction = payload / W_total', () => {
    expect(result.payloadFraction).toBeCloseTo(baseline.payloadKg / result.W_total, 4);
  });

  it('V_cruise equals V_bestLD (cruise at best L/D)', () => {
    expect(result.V_cruise).toBeCloseTo(result.V_bestLD, 5);
  });

  it('V_stall < V_cruise (cannot cruise slower than stall)', () => {
    expect(result.V_stall).toBeLessThan(result.V_cruise);
  });

  it('thrustMargin = thrustStatic - thrustRequired', () => {
    expect(result.thrustMargin).toBeCloseTo(result.thrustStatic - result.thrustRequired, 3);
  });

  it('L/D is positive and physically reasonable (> 5)', () => {
    expect(result.LD_ratio).toBeGreaterThan(5);
  });

  it('efficiency score is 0–100', () => {
    expect(result.efficiencyScore).toBeGreaterThanOrEqual(0);
    expect(result.efficiencyScore).toBeLessThanOrEqual(100);
  });

  it('maxPayloadKg is positive for a well-designed aircraft', () => {
    expect(result.maxPayloadKg).toBeGreaterThan(0);
  });

  it('endurance is a positive number of minutes', () => {
    expect(result.enduranceMin).toBeGreaterThan(0);
  });

  it('fuselageLength > L_ht (fuselage encompasses the tail arm)', () => {
    expect(result.fuselageLength).toBeGreaterThan(baseline.L_ht);
  });

  it('noseArm is 35% of fuselageLength', () => {
    expect(result.noseArm).toBeCloseTo(result.fuselageLength * 0.35, 4);
  });
});

// ─── Stability ────────────────────────────────────────────────────────────────

describe('calcOptimizedDesign — stability', () => {
  it('baseline design is stable (SM > 5%)', () => {
    const result = calcOptimizedDesign(baseline);
    expect(result.stabilityStatus).toBe('stable');
    expect(result.staticMargin).toBeGreaterThan(0.05);
  });

  it('moving CG aft reduces static margin', () => {
    const r1 = calcOptimizedDesign({ ...baseline, h_cg: 0.25 });
    const r2 = calcOptimizedDesign({ ...baseline, h_cg: 0.40 });
    expect(r2.staticMargin).toBeLessThan(r1.staticMargin);
  });

  it('oversized horizontal tail increases V_ht', () => {
    const small = calcOptimizedDesign({ ...baseline, S_ht: 0.15 });
    const large = calcOptimizedDesign({ ...baseline, S_ht: 0.30 });
    expect(large.V_ht).toBeGreaterThan(small.V_ht);
  });
});

// ─── Warnings ────────────────────────────────────────────────────────────────

describe('calcOptimizedDesign — warnings', () => {
  it('baseline clean design has no warnings', () => {
    const result = calcOptimizedDesign(baseline);
    expect(result.activeWarnings).toHaveLength(0);
  });

  it('TWR_LOW fires when motor is severely underpowered', () => {
    const result = calcOptimizedDesign({ ...baseline, manualThrustG: 200, payloadKg: 1.5 });
    expect(result.activeWarnings.some((w) => w.code === 'TWR_LOW')).toBe(true);
  });

  it('THRUST_MARGIN_NEG fires when motor thrust is far below level-flight drag', () => {
    // 50 g thrust vs ~119 g required at cruise → margin = −69 g
    const result = calcOptimizedDesign({ ...baseline, manualThrustG: 50, payloadKg: 0.8 });
    expect(result.activeWarnings.some((w) => w.code === 'THRUST_MARGIN_NEG')).toBe(true);
  });

  it('STALL_SPEED_HIGH fires when stall speed exceeds 8 m/s', () => {
    // Very small wing with heavy payload
    const result = calcOptimizedDesign({ ...baseline, S: 0.15, b: 0.9, c: 0.167, payloadKg: 1.8 });
    expect(result.activeWarnings.some((w) => w.code === 'STALL_SPEED_HIGH')).toBe(true);
  });

  it('BIPLANE_GAP_LOW fires for biplane with gap/chord < 0.8', () => {
    const result = calcOptimizedDesign({
      ...baseline,
      wingConfig: getWingConfigById('BIPLANE'),
      gapChordRatio: 0.5,
    });
    expect(result.activeWarnings.some((w) => w.code === 'BIPLANE_GAP_LOW')).toBe(true);
  });

  it('PAYLOAD_FRACTION_LOW fires when payload fraction < 25%', () => {
    // Very light payload, heavy materials
    const result = calcOptimizedDesign({
      ...baseline,
      wingMaterial: getMaterialById('COROPLAST'),
      tailMaterial: getMaterialById('COROPLAST'),
      payloadKg: 0.05,
    });
    expect(result.activeWarnings.some((w) => w.code === 'PAYLOAD_FRACTION_LOW')).toBe(true);
  });

  it('TWR_MARGINAL fires for 0.3 ≤ TWR < 0.5', () => {
    // Low thrust motor, moderately heavy aircraft
    const result = calcOptimizedDesign({
      ...baseline,
      manualThrustG: 480,
      payloadKg: 0.8,
    });
    const hasMarginal = result.activeWarnings.some((w) => w.code === 'TWR_MARGINAL');
    const hasCritical = result.activeWarnings.some((w) => w.code === 'TWR_LOW');
    // Either marginal or critical fires based on actual TWR
    if (result.TWR >= 0.3 && result.TWR < 0.5) expect(hasMarginal).toBe(true);
    if (result.TWR < 0.3) expect(hasCritical).toBe(true);
  });
});

// ─── Biplane vs Monoplane ─────────────────────────────────────────────────────

describe('calcOptimizedDesign — biplane config', () => {
  const monoplaneResult = calcOptimizedDesign({ ...baseline });
  const biplaneResult = calcOptimizedDesign({
    ...baseline,
    wingConfig: getWingConfigById('BIPLANE'),
    gapChordRatio: 1.0,
  });

  it('biplane has higher wing weight than monoplane (structural penalty)', () => {
    expect(biplaneResult.W_wing).toBeGreaterThan(monoplaneResult.W_wing);
  });

  it('biplane has higher total weight due to structural penalty', () => {
    expect(biplaneResult.W_total).toBeGreaterThan(monoplaneResult.W_total);
  });

  it('biplane returns a valid efficiency score', () => {
    expect(biplaneResult.efficiencyScore).toBeGreaterThanOrEqual(0);
    expect(biplaneResult.efficiencyScore).toBeLessThanOrEqual(100);
  });
});

// ─── Sensitivity ─────────────────────────────────────────────────────────────

describe('calcOptimizedDesign — input sensitivity', () => {
  it('larger wing area reduces stall speed', () => {
    const small = calcOptimizedDesign({ ...baseline, S: 0.7, b: 2.1, c: 0.333 });
    const large = calcOptimizedDesign({ ...baseline, S: 1.2, b: 2.8, c: 0.429 });
    expect(large.V_stall).toBeLessThan(small.V_stall);
  });

  it('more thrust increases maxPayloadKg', () => {
    const low  = calcOptimizedDesign({ ...baseline, motor: getMotorById('SCORPION_M2204') });
    const high = calcOptimizedDesign({ ...baseline, motor: getMotorById('TMOTOR_MN3110') });
    expect(high.maxPayloadKg).toBeGreaterThan(low.maxPayloadKg);
  });

  it('lighter wing material reduces W_wing and W_total', () => {
    const heavy = calcOptimizedDesign({ ...baseline, wingMaterial: getMaterialById('COROPLAST') });
    const light = calcOptimizedDesign({ ...baseline, wingMaterial: getMaterialById('DEPRON_3MM') });
    expect(light.W_wing).toBeLessThan(heavy.W_wing);
    expect(light.W_total).toBeLessThan(heavy.W_total);
  });

  it('scissors diagram is present and has 50 points', () => {
    const result = calcOptimizedDesign(baseline);
    expect(Array.isArray(result.scissorsData)).toBe(true);
    expect(result.scissorsData).toHaveLength(50);
  });
});
