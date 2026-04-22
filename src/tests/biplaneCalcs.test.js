import { describe, it, expect } from 'vitest';
import { WING_CONFIGS, getWingConfigById } from '../data/wingConfigs.js';
import {
  calcBiplaneCLmax,
  calcBiplaneTotalArea,
  calcBiplaneEquivArea,
  calcBiplaneWingWeight,
  compareBiplaneVsMonoplane,
} from '../logic/biplaneCalcs.js';

const monoConfig   = getWingConfigById('MONOPLANE');
const biConfig     = getWingConfigById('BIPLANE');
const sesquiConfig = getWingConfigById('SESQUIPLANE');

// ─── Biplane CL_max ───────────────────────────────────────────────────────────

describe('calcBiplaneCLmax', () => {
  it('biplane CL_max is less than single wing CL_max at gap/chord = 1.0', () => {
    const CL_bi = calcBiplaneCLmax(1.65, 0.85, 1.0);
    expect(CL_bi).toBeLessThan(1.65);
  });

  it('interference factor = 1.0 and gap/chord = 0 → recovers single wing CL_max', () => {
    expect(calcBiplaneCLmax(1.65, 1.0, 0)).toBeCloseTo(1.65, 5);
  });

  it('larger gap/chord ratio increases effective CL_max', () => {
    expect(calcBiplaneCLmax(1.65, 0.85, 1.5)).toBeGreaterThan(calcBiplaneCLmax(1.65, 0.85, 1.0));
  });

  it('formula: CL_max × factor × (1 + gap × 0.1)', () => {
    const CL_max_single = 1.65;
    const factor = 0.85;
    const gap = 1.2;
    const expected = CL_max_single * factor * (1 + gap * 0.1);
    expect(calcBiplaneCLmax(CL_max_single, factor, gap)).toBeCloseTo(expected, 6);
  });

  it('gap/chord = 1.0 with BIPLANE interference factor gives physically plausible result', () => {
    const CL = calcBiplaneCLmax(1.65, biConfig.liftInterferenceFactor, 1.0);
    expect(CL).toBeGreaterThan(1.0);
    expect(CL).toBeLessThan(1.65);
  });

  it('sesquiplane has higher effective CL_max than biplane (better interference factor)', () => {
    const bi = calcBiplaneCLmax(1.65, biConfig.liftInterferenceFactor, 1.0);
    const sesqui = calcBiplaneCLmax(1.65, sesquiConfig.liftInterferenceFactor, 1.0);
    expect(sesqui).toBeGreaterThan(bi);
  });
});

// ─── Biplane Total Area ───────────────────────────────────────────────────────

describe('calcBiplaneTotalArea', () => {
  it('sums upper and lower wing areas', () => {
    expect(calcBiplaneTotalArea(0.5, 0.5)).toBeCloseTo(1.0, 5);
  });

  it('equal span biplane: S_upper = S_lower', () => {
    expect(calcBiplaneTotalArea(0.45, 0.45)).toBeCloseTo(0.9, 5);
  });

  it('sesquiplane: lower wing is smaller', () => {
    const S_upper = 0.6;
    const S_lower = S_upper * 0.6;
    expect(calcBiplaneTotalArea(S_upper, S_lower)).toBeCloseTo(S_upper + S_lower, 5);
  });
});

// ─── Biplane Equivalent Area ──────────────────────────────────────────────────

describe('calcBiplaneEquivArea', () => {
  it('equivalent area is 90% of total area', () => {
    expect(calcBiplaneEquivArea(1.0)).toBeCloseTo(0.9, 5);
  });

  it('scales linearly', () => {
    expect(calcBiplaneEquivArea(2.0)).toBeCloseTo(calcBiplaneEquivArea(1.0) * 2, 5);
  });

  it('always less than total area', () => {
    expect(calcBiplaneEquivArea(0.9)).toBeLessThan(0.9);
  });
});

// ─── Biplane Wing Weight ──────────────────────────────────────────────────────

describe('calcBiplaneWingWeight', () => {
  it('heavier than monoplane by the structural factor', () => {
    const W_mono = 0.08;
    const factor = biConfig.structuralWeightFactor; // 1.30
    expect(calcBiplaneWingWeight(W_mono, factor)).toBeCloseTo(W_mono * factor, 5);
  });

  it('biplane is heavier than sesquiplane for the same base weight', () => {
    const W_mono = 0.08;
    const W_bi = calcBiplaneWingWeight(W_mono, biConfig.structuralWeightFactor);
    const W_sesqui = calcBiplaneWingWeight(W_mono, sesquiConfig.structuralWeightFactor);
    expect(W_bi).toBeGreaterThan(W_sesqui);
  });

  it('factor = 1.0 returns monoplane weight unchanged', () => {
    expect(calcBiplaneWingWeight(0.10, 1.0)).toBeCloseTo(0.10, 5);
  });
});

// ─── Biplane vs Monoplane Comparison ─────────────────────────────────────────

describe('compareBiplaneVsMonoplane', () => {
  const comparison = compareBiplaneVsMonoplane({
    CL_max_mono: 1.65,
    S_mono: 0.9,
    W_wing_mono: 0.079,
    gapChordRatio: 1.0,
    liftInterferenceFactor: biConfig.liftInterferenceFactor,
    dragPenaltyFactor: biConfig.dragPenaltyFactor,
    structuralWeightFactor: biConfig.structuralWeightFactor,
  });

  it('returns monoplane and biplane keys', () => {
    expect(comparison).toHaveProperty('monoplane');
    expect(comparison).toHaveProperty('biplane');
  });

  it('biplane has lower CL_max than monoplane', () => {
    expect(comparison.biplane.CL_max).toBeLessThan(comparison.monoplane.CL_max);
  });

  it('biplane wing is heavier than monoplane wing', () => {
    expect(comparison.biplane.W_wing).toBeGreaterThan(comparison.monoplane.W_wing);
  });

  it('biplane has drag penalty > 1.0', () => {
    expect(comparison.biplane.dragPenaltyFactor).toBeGreaterThan(1.0);
  });

  it('monoplane has drag penalty of exactly 1.0', () => {
    expect(comparison.monoplane.dragPenaltyFactor).toBeCloseTo(1.0, 5);
  });

  it('biplane S_total equals input S_mono (same total area)', () => {
    expect(comparison.biplane.S_total).toBeCloseTo(comparison.monoplane.S_wing, 5);
  });

  it('biplane S_equiv is less than S_total', () => {
    expect(comparison.biplane.S_equiv).toBeLessThan(comparison.biplane.S_total);
  });
});

// ─── Wing Configs data schema ─────────────────────────────────────────────────

describe('WING_CONFIGS data', () => {
  it('all configs have required fields', () => {
    WING_CONFIGS.forEach((wc) => {
      expect(wc).toHaveProperty('id');
      expect(wc).toHaveProperty('name');
      expect(wc).toHaveProperty('liftInterferenceFactor');
      expect(wc).toHaveProperty('dragPenaltyFactor');
      expect(wc).toHaveProperty('structuralWeightFactor');
      expect(wc).toHaveProperty('requiresGapInput');
      expect(wc).toHaveProperty('note');
    });
  });

  it('monoplane has interference factor of 1.0', () => {
    expect(monoConfig.liftInterferenceFactor).toBeCloseTo(1.0, 5);
  });

  it('only biplane and sesquiplane require gap input', () => {
    const needsGap = WING_CONFIGS.filter((wc) => wc.requiresGapInput);
    expect(needsGap).toHaveLength(2);
    needsGap.forEach((wc) => {
      expect(['BIPLANE', 'SESQUIPLANE']).toContain(wc.id);
    });
  });

  it('biplane has higher structural weight factor than sesquiplane', () => {
    expect(biConfig.structuralWeightFactor).toBeGreaterThan(sesquiConfig.structuralWeightFactor);
  });

  it('getWingConfigById throws on unknown id', () => {
    expect(() => getWingConfigById('NONEXISTENT')).toThrow();
  });
});
