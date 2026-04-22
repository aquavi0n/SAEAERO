import { describe, it, expect } from 'vitest';
import { AIRFOILS } from '../data/airfoils.js';
import { TAIL_CONFIGS } from '../data/tailConfigs.js';
import {
  calcVht,
  calcVvt,
  calcVtailEffectiveVolumes,
  calcAspectRatio,
  calcNeutralPoint,
  calcStaticMargin,
  getStabilityStatus,
  getStallRisk,
  getActiveWarnings,
  generateScissorsDiagramData,
  calcAero,
} from '../logic/aeroCalcs.js';
import { getAirfoilById } from '../data/airfoils.js';
import { getTailConfigById } from '../data/tailConfigs.js';

// ─── Tail Volume Coefficients ─────────────────────────────────────────────────

describe('calcVht', () => {
  it('computes correct value for known inputs', () => {
    // V_ht = (0.2 * 0.8) / (1.0 * 0.25) = 0.64
    expect(calcVht(0.2, 0.8, 1.0, 0.25)).toBeCloseTo(0.64, 5);
  });

  it('scales linearly with S_ht', () => {
    expect(calcVht(0.4, 0.8, 1.0, 0.25)).toBeCloseTo(calcVht(0.2, 0.8, 1.0, 0.25) * 2, 5);
  });

  it('scales linearly with L_ht', () => {
    expect(calcVht(0.2, 1.6, 1.0, 0.25)).toBeCloseTo(calcVht(0.2, 0.8, 1.0, 0.25) * 2, 5);
  });

  it('is inversely proportional to wing area S', () => {
    expect(calcVht(0.2, 0.8, 2.0, 0.25)).toBeCloseTo(calcVht(0.2, 0.8, 1.0, 0.25) / 2, 5);
  });

  it('is inversely proportional to chord c', () => {
    expect(calcVht(0.2, 0.8, 1.0, 0.5)).toBeCloseTo(calcVht(0.2, 0.8, 1.0, 0.25) / 2, 5);
  });
});

describe('calcVvt', () => {
  it('computes correct value for known inputs', () => {
    // V_vt = (0.1 * 0.8) / (1.0 * 2.0) = 0.04
    expect(calcVvt(0.1, 0.8, 1.0, 2.0)).toBeCloseTo(0.04, 5);
  });

  it('scales linearly with S_vt', () => {
    expect(calcVvt(0.2, 0.8, 1.0, 2.0)).toBeCloseTo(calcVvt(0.1, 0.8, 1.0, 2.0) * 2, 5);
  });
});

// ─── V-Tail Effective Volumes ─────────────────────────────────────────────────

describe('calcVtailEffectiveVolumes', () => {
  it('at 0° dihedral all contribution is horizontal', () => {
    const { V_ht, V_vt } = calcVtailEffectiveVolumes(0.2, 0.8, 0.8, 1.0, 0.25, 2.0, 0);
    expect(V_ht).toBeCloseTo(calcVht(0.2, 0.8, 1.0, 0.25), 5);
    expect(V_vt).toBeCloseTo(0, 5);
  });

  it('at 90° dihedral all contribution is vertical', () => {
    const { V_ht, V_vt } = calcVtailEffectiveVolumes(0.2, 0.8, 0.8, 1.0, 0.25, 2.0, 90);
    expect(V_ht).toBeCloseTo(0, 5);
    expect(V_vt).toBeCloseTo(calcVvt(0.2, 0.8, 1.0, 2.0), 5);
  });

  it('at 45° dihedral contributions are equal (cos²45 = sin²45 = 0.5)', () => {
    const { V_ht, V_vt } = calcVtailEffectiveVolumes(0.2, 0.8, 0.8, 1.0, 0.25, 2.0, 45);
    const base_ht = calcVht(0.2, 0.8, 1.0, 0.25);
    const base_vt = calcVvt(0.2, 0.8, 1.0, 2.0);
    expect(V_ht).toBeCloseTo(base_ht * 0.5, 5);
    expect(V_vt).toBeCloseTo(base_vt * 0.5, 5);
  });

  it('typical 35° V-tail gives more horizontal than vertical contribution', () => {
    const { V_ht, V_vt } = calcVtailEffectiveVolumes(0.2, 0.8, 0.8, 1.0, 0.25, 2.0, 35);
    expect(V_ht).toBeGreaterThan(V_vt);
  });
});

// ─── Aspect Ratio ─────────────────────────────────────────────────────────────

describe('calcAspectRatio', () => {
  it('computes AR = b²/S', () => {
    expect(calcAspectRatio(2.0, 1.0)).toBeCloseTo(4.0, 5);
    expect(calcAspectRatio(3.0, 0.75)).toBeCloseTo(12.0, 5);
  });

  it('higher aspect ratio for same area with longer span', () => {
    expect(calcAspectRatio(3, 1)).toBeGreaterThan(calcAspectRatio(2, 1));
  });
});

// ─── Neutral Point ────────────────────────────────────────────────────────────

describe('calcNeutralPoint', () => {
  it('equals h_ac (0.25) when V_ht is 0', () => {
    expect(calcNeutralPoint(0, 7)).toBeCloseTo(0.25, 5);
  });

  it('increases with V_ht (more tail = further aft NP)', () => {
    expect(calcNeutralPoint(0.6, 7)).toBeGreaterThan(calcNeutralPoint(0.4, 7));
  });

  it('increases with tail modifier > 1 (T-tail effect)', () => {
    expect(calcNeutralPoint(0.5, 7, 1.05)).toBeGreaterThan(calcNeutralPoint(0.5, 7, 1.0));
  });

  it('higher AR reduces downwash effect (moves NP further aft)', () => {
    // Higher AR → lower downwash gradient → (1 - dε/dα) larger → NP further aft
    expect(calcNeutralPoint(0.5, 10)).toBeGreaterThan(calcNeutralPoint(0.5, 5));
  });

  it('returns a value in a physically plausible range (0.2 to 0.8)', () => {
    const h_n = calcNeutralPoint(0.5, 7);
    expect(h_n).toBeGreaterThan(0.2);
    expect(h_n).toBeLessThan(0.8);
  });
});

// ─── Static Margin ────────────────────────────────────────────────────────────

describe('calcStaticMargin', () => {
  it('is positive when CG is ahead of NP (stable)', () => {
    expect(calcStaticMargin(0.45, 0.30)).toBeCloseTo(0.15, 5);
  });

  it('is zero when CG equals NP (neutral stability)', () => {
    expect(calcStaticMargin(0.40, 0.40)).toBeCloseTo(0.0, 5);
  });

  it('is negative when CG is aft of NP (unstable)', () => {
    expect(calcStaticMargin(0.35, 0.40)).toBeCloseTo(-0.05, 5);
  });
});

// ─── Stability Status ─────────────────────────────────────────────────────────

describe('getStabilityStatus', () => {
  it('returns "stable" for SM >= 5%', () => {
    expect(getStabilityStatus(0.05)).toBe('stable');
    expect(getStabilityStatus(0.15)).toBe('stable');
    expect(getStabilityStatus(0.10)).toBe('stable');
  });

  it('returns "marginal" for SM in [0, 5%)', () => {
    expect(getStabilityStatus(0.0)).toBe('marginal');
    expect(getStabilityStatus(0.01)).toBe('marginal');
    expect(getStabilityStatus(0.049)).toBe('marginal');
  });

  it('returns "unstable" for SM < 0', () => {
    expect(getStabilityStatus(-0.01)).toBe('unstable');
    expect(getStabilityStatus(-0.20)).toBe('unstable');
  });
});

// ─── Stall Risk ───────────────────────────────────────────────────────────────

describe('getStallRisk', () => {
  const naca2412 = getAirfoilById('NACA_2412'); // stallAngle = 16°

  it('returns "low" well below stall', () => {
    expect(getStallRisk(naca2412, 5)).toBe('low');
  });

  it('returns "moderate" at 70–85% of stall angle', () => {
    expect(getStallRisk(naca2412, 12)).toBe('moderate'); // 12/16 = 75%
  });

  it('returns "high" at 85–100% of stall angle', () => {
    expect(getStallRisk(naca2412, 14)).toBe('high'); // 14/16 = 87.5%
  });

  it('returns "stalled" at or beyond stall angle', () => {
    expect(getStallRisk(naca2412, 16)).toBe('stalled');
    expect(getStallRisk(naca2412, 20)).toBe('stalled');
  });

  it('S1223 stalls earlier than NACA 2412 at the same AOA', () => {
    const s1223 = getAirfoilById('S1223');
    // aoa=12: S1223 ratio=1.2 → stalled, naca2412 ratio=0.75 → moderate
    expect(getStallRisk(s1223, 12)).toBe('stalled');
    expect(getStallRisk(naca2412, 12)).toBe('moderate');
  });
});

// ─── Active Warnings ─────────────────────────────────────────────────────────

describe('getActiveWarnings', () => {
  const conventional = getTailConfigById('CONVENTIONAL');
  const tTail = getTailConfigById('T_TAIL');
  const vTail = getTailConfigById('V_TAIL');
  const naca2412 = getAirfoilById('NACA_2412');
  const s1223 = getAirfoilById('S1223');

  it('returns no warnings for a clean stable design', () => {
    const warnings = getActiveWarnings({
      V_ht: 0.5,
      V_vt: 0.05,
      tailConfig: conventional,
      staticMargin: 0.10,
      airfoil: naca2412,
      flaperonsEnabled: false,
    });
    expect(warnings).toHaveLength(0);
  });

  it('triggers VHT_LOW when V_ht < 0.4', () => {
    const warnings = getActiveWarnings({
      V_ht: 0.3,
      V_vt: 0.05,
      tailConfig: conventional,
      staticMargin: 0.10,
      airfoil: naca2412,
      flaperonsEnabled: false,
    });
    expect(warnings.some((w) => w.code === 'VHT_LOW')).toBe(true);
    expect(warnings.find((w) => w.code === 'VHT_LOW').severity).toBe('critical');
  });

  it('triggers VVT_LOW when V_vt < 0.02', () => {
    const warnings = getActiveWarnings({
      V_ht: 0.5,
      V_vt: 0.01,
      tailConfig: conventional,
      staticMargin: 0.10,
      airfoil: naca2412,
      flaperonsEnabled: false,
    });
    expect(warnings.some((w) => w.code === 'VVT_LOW')).toBe(true);
  });

  it('triggers CG_AFT_NP when static margin is negative', () => {
    const warnings = getActiveWarnings({
      V_ht: 0.5,
      V_vt: 0.05,
      tailConfig: conventional,
      staticMargin: -0.05,
      airfoil: naca2412,
      flaperonsEnabled: false,
    });
    expect(warnings.some((w) => w.code === 'CG_AFT_NP')).toBe(true);
  });

  it('always shows T-tail deep stall warning when T-tail is selected', () => {
    const warnings = getActiveWarnings({
      V_ht: 0.5,
      V_vt: 0.05,
      tailConfig: tTail,
      staticMargin: 0.10,
      airfoil: naca2412,
      flaperonsEnabled: false,
    });
    expect(warnings.some((w) => w.code === 'T_TAIL_DEEP_STALL')).toBe(true);
    expect(warnings.find((w) => w.code === 'T_TAIL_DEEP_STALL').severity).toBe('warning');
  });

  it('shows airfoil warning for S1223', () => {
    const warnings = getActiveWarnings({
      V_ht: 0.5,
      V_vt: 0.05,
      tailConfig: conventional,
      staticMargin: 0.10,
      airfoil: s1223,
      flaperonsEnabled: false,
    });
    expect(warnings.some((w) => w.code === 'AIRFOIL_WARNING')).toBe(true);
  });

  it('shows flaperons warning when enabled', () => {
    const warnings = getActiveWarnings({
      V_ht: 0.5,
      V_vt: 0.05,
      tailConfig: conventional,
      staticMargin: 0.10,
      airfoil: naca2412,
      flaperonsEnabled: true,
    });
    expect(warnings.some((w) => w.code === 'FLAPERONS_COMPLEXITY')).toBe(true);
    expect(warnings.find((w) => w.code === 'FLAPERONS_COMPLEXITY').severity).toBe('info');
  });

  it('can trigger multiple warnings simultaneously', () => {
    const warnings = getActiveWarnings({
      V_ht: 0.2, // VHT_LOW
      V_vt: 0.01, // VVT_LOW
      tailConfig: tTail, // T_TAIL_DEEP_STALL
      staticMargin: -0.1, // CG_AFT_NP
      airfoil: s1223, // AIRFOIL_WARNING
      flaperonsEnabled: true, // FLAPERONS_COMPLEXITY
    });
    const codes = warnings.map((w) => w.code);
    expect(codes).toContain('VHT_LOW');
    expect(codes).toContain('VVT_LOW');
    expect(codes).toContain('T_TAIL_DEEP_STALL');
    expect(codes).toContain('CG_AFT_NP');
    expect(codes).toContain('AIRFOIL_WARNING');
    expect(codes).toContain('FLAPERONS_COMPLEXITY');
  });

  it('V-tail mixing warning appears (not T_TAIL_DEEP_STALL) with V-tail', () => {
    const warnings = getActiveWarnings({
      V_ht: 0.5,
      V_vt: 0.05,
      tailConfig: vTail,
      staticMargin: 0.10,
      airfoil: naca2412,
      flaperonsEnabled: false,
    });
    expect(warnings.some((w) => w.code === 'T_TAIL_DEEP_STALL')).toBe(false);
    expect(warnings.some((w) => w.code.startsWith('TAIL_WARNING'))).toBe(true);
  });
});

// ─── Scissors Diagram Data ────────────────────────────────────────────────────

describe('generateScissorsDiagramData', () => {
  it('returns the expected number of steps', () => {
    const data = generateScissorsDiagramData({ AR: 7, steps: 50 });
    expect(data).toHaveLength(50);
  });

  it('NP increases as V_ht increases', () => {
    const data = generateScissorsDiagramData({ AR: 7 });
    for (let i = 1; i < data.length; i++) {
      expect(data[i].NP).toBeGreaterThanOrEqual(data[i - 1].NP);
    }
  });

  it('CGlimit = NP - minStaticMargin', () => {
    const data = generateScissorsDiagramData({ AR: 7, minStaticMargin: 0.05 });
    data.forEach(({ NP, CGlimit }) => {
      expect(NP - CGlimit).toBeCloseTo(0.05, 3);
    });
  });

  it('first V_ht value is ~0.1', () => {
    const data = generateScissorsDiagramData({ AR: 7 });
    expect(data[0].V_ht).toBeCloseTo(0.1, 2);
  });

  it('last V_ht value is ~1.2', () => {
    const data = generateScissorsDiagramData({ AR: 7 });
    expect(data[data.length - 1].V_ht).toBeCloseTo(1.2, 2);
  });
});

// ─── Master calcAero ──────────────────────────────────────────────────────────

describe('calcAero', () => {
  const naca2412 = getAirfoilById('NACA_2412');
  const conventional = getTailConfigById('CONVENTIONAL');
  const vTail = getTailConfigById('V_TAIL');
  const tTail = getTailConfigById('T_TAIL');

  // A reasonable SAE Aero design baseline
  const baseline = {
    S: 1.0, b: 2.5, c: 0.4,
    S_ht: 0.2, S_vt: 0.08,
    L_ht: 0.85, L_vt: 0.85,
    airfoil: naca2412,
    tailConfig: conventional,
    h_cg: 0.30,
    aoa: 5,
  };

  it('returns all expected output keys', () => {
    const result = calcAero(baseline);
    expect(result).toHaveProperty('V_ht');
    expect(result).toHaveProperty('V_vt');
    expect(result).toHaveProperty('AR');
    expect(result).toHaveProperty('h_n');
    expect(result).toHaveProperty('staticMargin');
    expect(result).toHaveProperty('stabilityStatus');
    expect(result).toHaveProperty('stallRisk');
    expect(result).toHaveProperty('activeWarnings');
    expect(result).toHaveProperty('scissorsData');
  });

  it('baseline design is stable with low stall risk', () => {
    const result = calcAero(baseline);
    expect(result.stabilityStatus).toBe('stable');
    expect(result.stallRisk).toBe('low');
    expect(result.activeWarnings).toHaveLength(0);
  });

  it('AR is computed correctly from baseline inputs', () => {
    const result = calcAero(baseline);
    expect(result.AR).toBeCloseTo(2.5 ** 2 / 1.0, 5); // 6.25
  });

  it('increasing S_ht increases V_ht and moves NP aft', () => {
    const bigger = { ...baseline, S_ht: 0.35 };
    const r1 = calcAero(baseline);
    const r2 = calcAero(bigger);
    expect(r2.V_ht).toBeGreaterThan(r1.V_ht);
    expect(r2.h_n).toBeGreaterThan(r1.h_n);
  });

  it('moving CG aft toward NP reduces static margin', () => {
    const r1 = calcAero({ ...baseline, h_cg: 0.25 });
    const r2 = calcAero({ ...baseline, h_cg: 0.38 });
    expect(r2.staticMargin).toBeLessThan(r1.staticMargin);
  });

  it('CG behind NP triggers unstable status and CG_AFT_NP warning', () => {
    const result = calcAero({ ...baseline, h_cg: 0.60 });
    expect(result.stabilityStatus).toBe('unstable');
    expect(result.activeWarnings.some((w) => w.code === 'CG_AFT_NP')).toBe(true);
  });

  it('T-tail always emits deep stall warning regardless of design', () => {
    const result = calcAero({ ...baseline, tailConfig: tTail });
    expect(result.activeWarnings.some((w) => w.code === 'T_TAIL_DEEP_STALL')).toBe(true);
  });

  it('V-tail at 35° produces valid split of V_ht and V_vt', () => {
    const result = calcAero({ ...baseline, tailConfig: vTail, dihedralAngle: 35 });
    expect(result.V_ht).toBeGreaterThan(0);
    expect(result.V_vt).toBeGreaterThan(0);
    // cos²(35°) > sin²(35°), so horizontal component dominates
    const raw_V_ht = calcVht(baseline.S_ht, baseline.L_ht, baseline.S, baseline.c);
    const raw_V_vt = calcVvt(baseline.S_ht, baseline.L_vt, baseline.S, baseline.b);
    expect(result.V_ht).toBeLessThan(raw_V_ht);
    expect(result.V_vt).toBeLessThan(raw_V_vt);
  });

  it('high AOA near stall angle returns high or stalled risk', () => {
    const result = calcAero({ ...baseline, aoa: 15 }); // naca2412 stalls at 16°
    expect(['high', 'stalled']).toContain(result.stallRisk);
  });

  it('undersized horizontal tail triggers VHT_LOW warning', () => {
    const result = calcAero({ ...baseline, S_ht: 0.05, L_ht: 0.5 });
    expect(result.activeWarnings.some((w) => w.code === 'VHT_LOW')).toBe(true);
  });

  it('scissors diagram data has the right shape', () => {
    const result = calcAero(baseline);
    expect(result.scissorsData.length).toBe(50);
    expect(result.scissorsData[0]).toHaveProperty('V_ht');
    expect(result.scissorsData[0]).toHaveProperty('NP');
    expect(result.scissorsData[0]).toHaveProperty('CGlimit');
  });
});

// ─── Data Layer ───────────────────────────────────────────────────────────────

describe('airfoil data', () => {
  it('all airfoils have required fields', () => {
    AIRFOILS.forEach((a) => {
      expect(a).toHaveProperty('id');
      expect(a).toHaveProperty('name');
      expect(a).toHaveProperty('CL_max');
      expect(a).toHaveProperty('stallAngle');
      expect(a).toHaveProperty('constructionNote');
      expect(a.CL_max).toBeGreaterThan(0);
      expect(a.stallAngle).toBeGreaterThan(0);
    });
  });

  it('getAirfoilById throws on unknown id', () => {
    expect(() => getAirfoilById('NONEXISTENT')).toThrow();
  });
});

describe('tail config data', () => {
  it('all tail configs have required fields', () => {
    TAIL_CONFIGS.forEach((t) => {
      expect(t).toHaveProperty('id');
      expect(t).toHaveProperty('name');
      expect(t).toHaveProperty('modifier');
      expect(t).toHaveProperty('requiresDihedral');
      expect(t).toHaveProperty('warnings');
      expect(Array.isArray(t.warnings)).toBe(true);
      expect(t.modifier).toBeGreaterThan(0);
    });
  });

  it('only V-tail requires dihedral', () => {
    const dihedralRequired = TAIL_CONFIGS.filter((t) => t.requiresDihedral);
    expect(dihedralRequired).toHaveLength(1);
    expect(dihedralRequired[0].id).toBe('V_TAIL');
  });

  it('getTailConfigById throws on unknown id', () => {
    expect(() => getTailConfigById('NONEXISTENT')).toThrow();
  });
});
