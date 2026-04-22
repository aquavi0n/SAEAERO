import { describe, it, expect } from 'vitest';
import {
  calcFuselageLength,
  calcNoseArm,
  calcFrontalArea,
  calcFuselageDragCoeff,
  calcWettedArea,
} from '../logic/fuselageCalcs.js';

// ─── Fuselage Length ──────────────────────────────────────────────────────────

describe('calcFuselageLength', () => {
  it('L_ht=0.85 m, c=0.38 m → 0.85 + 0.5×0.38 = 1.04 m', () => {
    expect(calcFuselageLength(0.85, 0.38)).toBeCloseTo(1.04, 4);
  });

  it('longer tail arm produces longer fuselage', () => {
    expect(calcFuselageLength(1.0, 0.38)).toBeGreaterThan(calcFuselageLength(0.8, 0.38));
  });

  it('larger chord slightly increases fuselage length', () => {
    expect(calcFuselageLength(0.85, 0.50)).toBeGreaterThan(calcFuselageLength(0.85, 0.30));
  });

  it('always greater than the tail arm alone', () => {
    const L_ht = 0.80;
    expect(calcFuselageLength(L_ht, 0.38)).toBeGreaterThan(L_ht);
  });
});

// ─── Nose Arm ─────────────────────────────────────────────────────────────────

describe('calcNoseArm', () => {
  it('returns 35% of fuselage length', () => {
    expect(calcNoseArm(1.0)).toBeCloseTo(0.35, 5);
    expect(calcNoseArm(1.2)).toBeCloseTo(0.42, 5);
  });

  it('scales linearly with fuselage length', () => {
    expect(calcNoseArm(2.0)).toBeCloseTo(calcNoseArm(1.0) * 2, 5);
  });
});

// ─── Frontal Area ─────────────────────────────────────────────────────────────

describe('calcFrontalArea', () => {
  it('0.12 m × 0.12 m = 0.0144 m²', () => {
    expect(calcFrontalArea(0.12, 0.12)).toBeCloseTo(0.0144, 5);
  });

  it('scales with width', () => {
    expect(calcFrontalArea(0.20, 0.12)).toBeCloseTo(2 * calcFrontalArea(0.10, 0.12) / 1, 5);
  });

  it('rectangular cross section — width × height', () => {
    expect(calcFrontalArea(0.15, 0.10)).toBeCloseTo(0.015, 5);
  });
});

// ─── Fuselage Drag Coefficient ────────────────────────────────────────────────

describe('calcFuselageDragCoeff', () => {
  it('computes CD_fuse = 0.006 × A_frontal / S_wing', () => {
    const A = 0.12 * 0.12; // 0.0144 m²
    const S = 0.9;
    expect(calcFuselageDragCoeff(0.12, 0.12, 0.9)).toBeCloseTo(0.006 * A / S, 6);
  });

  it('larger frontal area increases fuselage drag', () => {
    expect(calcFuselageDragCoeff(0.20, 0.20, 0.9)).toBeGreaterThan(
      calcFuselageDragCoeff(0.10, 0.10, 0.9),
    );
  });

  it('larger wing area reduces the drag coefficient (same fuselage, more reference area)', () => {
    expect(calcFuselageDragCoeff(0.12, 0.12, 1.5)).toBeLessThan(
      calcFuselageDragCoeff(0.12, 0.12, 0.9),
    );
  });

  it('typical SAE fuselage adds < 0.005 to total CD', () => {
    // 0.12×0.12 fuselage, 0.9 m² wing: ~0.00096
    expect(calcFuselageDragCoeff(0.12, 0.12, 0.9)).toBeLessThan(0.005);
  });
});

// ─── Wetted Area ──────────────────────────────────────────────────────────────

describe('calcWettedArea', () => {
  it('totals all surfaces: wing + ht + vt + 2×fuse_side', () => {
    const S_wet = calcWettedArea(0.9, 0.18, 0.07, 0.15);
    expect(S_wet).toBeCloseTo(0.9 + 0.18 + 0.07 + 0.30, 5);
  });

  it('increases when any surface area increases', () => {
    expect(calcWettedArea(1.2, 0.18, 0.07, 0.15)).toBeGreaterThan(
      calcWettedArea(0.9, 0.18, 0.07, 0.15),
    );
  });

  it('fuse_side is counted twice (two sides of fuselage)', () => {
    const single = calcWettedArea(0.9, 0, 0, 0.10);
    const double = calcWettedArea(0.9, 0, 0, 0.20);
    expect(double - single).toBeCloseTo(0.20, 5);
  });
});
