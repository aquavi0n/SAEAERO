import { describe, it, expect } from 'vitest';
import { MATERIALS, getMaterialById } from '../data/materials.js';
import {
  calcWingWeight,
  calcTailWeight,
  calcWeightBudget,
  calcPayloadFraction,
  calcStructuralEfficiency,
} from '../logic/weightCalcs.js';

const balsa = getMaterialById('BALSA_3MM');   // 0.040 kg/m²
const cf    = getMaterialById('CF_1MM');      // 0.140 kg/m²
const coro  = getMaterialById('COROPLAST');   // 0.900 kg/m²

// ─── Wing Weight ──────────────────────────────────────────────────────────────

describe('calcWingWeight', () => {
  it('computes correctly: S=0.9 m², balsa → 0.9 × 0.040 × 2.2 = 0.0792 kg', () => {
    expect(calcWingWeight(0.9, balsa)).toBeCloseTo(0.0792, 4);
  });

  it('scales linearly with wing area', () => {
    expect(calcWingWeight(1.8, balsa)).toBeCloseTo(calcWingWeight(0.9, balsa) * 2, 5);
  });

  it('heavier material yields heavier wing', () => {
    expect(calcWingWeight(0.9, cf)).toBeGreaterThan(calcWingWeight(0.9, balsa));
  });

  it('coroplast is much heavier than balsa for the same area', () => {
    expect(calcWingWeight(0.9, coro)).toBeGreaterThan(calcWingWeight(0.9, balsa) * 5);
  });
});

// ─── Tail Weight ─────────────────────────────────────────────────────────────

describe('calcTailWeight', () => {
  it('computes correctly: S_ht=0.18 + S_vt=0.07, balsa → 0.25 × 0.040 × 1.5 = 0.015 kg', () => {
    expect(calcTailWeight(0.18, 0.07, balsa)).toBeCloseTo(0.015, 4);
  });

  it('scales linearly with total tail area', () => {
    expect(calcTailWeight(0.36, 0.14, balsa)).toBeCloseTo(calcTailWeight(0.18, 0.07, balsa) * 2, 5);
  });

  it('tail structural factor (1.5) makes tail lighter per m² than wing (2.2)', () => {
    const perM2Wing = calcWingWeight(1.0, balsa);
    const perM2Tail = calcTailWeight(0.5, 0.5, balsa); // 1.0 m² total
    expect(perM2Tail).toBeLessThan(perM2Wing);
  });
});

// ─── Weight Budget ────────────────────────────────────────────────────────────

describe('calcWeightBudget', () => {
  const base = {
    W_wing_kg: 0.080,
    W_tail_kg: 0.015,
    W_fuselage_kg: 0.200,
    W_motor_kg: 0.068,
    W_battery_kg: 0.195,
    W_electronics_kg: 0.150,
    W_payload_kg: 0.500,
  };

  it('W_total = sum of all components', () => {
    const { W_total_kg } = calcWeightBudget(base);
    const expected = 0.080 + 0.015 + 0.200 + 0.068 + 0.195 + 0.150 + 0.500;
    expect(W_total_kg).toBeCloseTo(expected, 5);
  });

  it('W_empty = W_total - payload', () => {
    const { W_total_kg, W_empty_kg } = calcWeightBudget(base);
    expect(W_empty_kg).toBeCloseTo(W_total_kg - base.W_payload_kg, 5);
  });

  it('payloadFraction = payload / total', () => {
    const { W_total_kg, payloadFraction } = calcWeightBudget(base);
    expect(payloadFraction).toBeCloseTo(base.W_payload_kg / W_total_kg, 5);
  });

  it('zero payload gives payloadFraction = 0', () => {
    const { payloadFraction } = calcWeightBudget({ ...base, W_payload_kg: 0 });
    expect(payloadFraction).toBeCloseTo(0, 5);
  });

  it('defaults W_electronics_kg to 0.150 when omitted', () => {
    const withElec = calcWeightBudget(base);
    const { W_electronics_kg: _, ...noElec } = base;
    const withoutKey = calcWeightBudget(noElec);
    expect(withElec.W_total_kg).toBeCloseTo(withoutKey.W_total_kg, 5);
  });

  it('heavier payload increases total weight and reduces payload fraction non-linearly', () => {
    const light = calcWeightBudget({ ...base, W_payload_kg: 0.2 });
    const heavy = calcWeightBudget({ ...base, W_payload_kg: 1.0 });
    expect(heavy.W_total_kg).toBeGreaterThan(light.W_total_kg);
    // Heavier payload fraction despite heavier total — payload dominates
    expect(heavy.payloadFraction).toBeGreaterThan(light.payloadFraction);
  });
});

// ─── Payload Fraction ─────────────────────────────────────────────────────────

describe('calcPayloadFraction', () => {
  it('0.5 kg payload in 1.2 kg total → 41.7%', () => {
    expect(calcPayloadFraction(0.5, 1.2)).toBeCloseTo(0.4167, 3);
  });

  it('zero payload gives zero fraction', () => {
    expect(calcPayloadFraction(0, 1.2)).toBeCloseTo(0, 5);
  });

  it('payload equal to total weight gives fraction = 1', () => {
    expect(calcPayloadFraction(1.0, 1.0)).toBeCloseTo(1.0, 5);
  });
});

// ─── Structural Efficiency ────────────────────────────────────────────────────

describe('calcStructuralEfficiency', () => {
  it('0.5 kg payload / 0.6 kg empty → 0.833', () => {
    expect(calcStructuralEfficiency(0.5, 0.6)).toBeCloseTo(0.833, 2);
  });

  it('increases as payload grows relative to empty weight', () => {
    expect(calcStructuralEfficiency(1.0, 0.6)).toBeGreaterThan(calcStructuralEfficiency(0.5, 0.6));
  });

  it('good SAE designs (0.8–1.5) are achievable with reasonable inputs', () => {
    const se = calcStructuralEfficiency(0.6, 0.6);
    expect(se).toBeGreaterThanOrEqual(0.8);
    expect(se).toBeLessThanOrEqual(1.5);
  });
});

// ─── Materials data schema ────────────────────────────────────────────────────

describe('MATERIALS data', () => {
  it('all materials have required fields with valid types', () => {
    MATERIALS.forEach((m) => {
      expect(m).toHaveProperty('id');
      expect(m).toHaveProperty('name');
      expect(m).toHaveProperty('densityKgM2');
      expect(m).toHaveProperty('structuralScore');
      expect(m).toHaveProperty('buildDifficulty');
      expect(m).toHaveProperty('costScore');
      expect(m).toHaveProperty('note');
      expect(m.densityKgM2).toBeGreaterThan(0);
      expect(m.structuralScore).toBeGreaterThanOrEqual(1);
      expect(m.structuralScore).toBeLessThanOrEqual(10);
      expect(['easy', 'medium', 'hard']).toContain(m.buildDifficulty);
      expect(m.costScore).toBeGreaterThanOrEqual(1);
      expect(m.costScore).toBeLessThanOrEqual(5);
    });
  });

  it('carbon fiber is the highest structural score', () => {
    const maxScore = Math.max(...MATERIALS.map((m) => m.structuralScore));
    expect(cf.structuralScore).toBe(maxScore);
  });

  it('getMaterialById throws on unknown id', () => {
    expect(() => getMaterialById('NONEXISTENT')).toThrow();
  });

  it('getMaterialById returns correct entry', () => {
    expect(getMaterialById('BALSA_3MM').densityKgM2).toBeCloseTo(0.040, 4);
  });
});
