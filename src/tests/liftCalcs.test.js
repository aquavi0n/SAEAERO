import { describe, it, expect } from 'vitest';
import {
  calcRequiredWingArea,
  calcStallSpeed,
  calcRequiredCL,
  calcCD,
  calcLiftToDrag,
  calcBestLDSpeed,
  calcBestLDCL,
  calcMaxLD,
} from '../logic/liftCalcs.js';

const RHO = 1.225;
const G = 9.81;

// ─── Required Wing Area ───────────────────────────────────────────────────────

describe('calcRequiredWingArea', () => {
  it('computes correct value for known inputs', () => {
    // S = 2 * 1.5 * 9.81 / (1.225 * 10² * 1.2) = 29.43 / 147 ≈ 0.2002
    const S = calcRequiredWingArea(1.5, 10, 1.2);
    expect(S).toBeCloseTo((2 * 1.5 * G) / (RHO * 100 * 1.2), 5);
  });

  it('heavier aircraft requires more wing area at same speed and CL', () => {
    expect(calcRequiredWingArea(2.0, 10, 1.2)).toBeGreaterThan(calcRequiredWingArea(1.0, 10, 1.2));
  });

  it('higher cruise speed reduces required wing area', () => {
    expect(calcRequiredWingArea(1.5, 15, 1.2)).toBeLessThan(calcRequiredWingArea(1.5, 10, 1.2));
  });

  it('higher CL reduces required wing area', () => {
    expect(calcRequiredWingArea(1.5, 10, 1.8)).toBeLessThan(calcRequiredWingArea(1.5, 10, 1.2));
  });

  it('lower air density requires more area (high altitude)', () => {
    expect(calcRequiredWingArea(1.5, 10, 1.2, 1.0)).toBeGreaterThan(
      calcRequiredWingArea(1.5, 10, 1.2, 1.225),
    );
  });
});

// ─── Stall Speed ─────────────────────────────────────────────────────────────

describe('calcStallSpeed', () => {
  it('computes correct value for known inputs', () => {
    // V = sqrt(2 * 1.2 * 9.81 / (1.225 * 1.5 * 0.9)) = sqrt(23.544 / 1.654) = sqrt(14.234) ≈ 3.773
    const V = calcStallSpeed(1.2, 0.9, 1.5);
    expect(V).toBeCloseTo(Math.sqrt((2 * 1.2 * G) / (RHO * 1.5 * 0.9)), 4);
  });

  it('heavier aircraft stalls faster', () => {
    expect(calcStallSpeed(2.0, 0.9, 1.5)).toBeGreaterThan(calcStallSpeed(1.0, 0.9, 1.5));
  });

  it('larger wing area reduces stall speed', () => {
    expect(calcStallSpeed(1.5, 1.5, 1.5)).toBeLessThan(calcStallSpeed(1.5, 0.9, 1.5));
  });

  it('higher CL_max reduces stall speed', () => {
    expect(calcStallSpeed(1.5, 0.9, 2.1)).toBeLessThan(calcStallSpeed(1.5, 0.9, 1.5));
  });

  it('stall speed is always positive', () => {
    expect(calcStallSpeed(1.0, 0.5, 1.2)).toBeGreaterThan(0);
  });

  it('a typical SAE Aero design (1.2 kg, 0.9 m², CL_max 1.5) stalls below 5 m/s', () => {
    expect(calcStallSpeed(1.2, 0.9, 1.5)).toBeLessThan(5);
  });
});

// ─── Required CL ─────────────────────────────────────────────────────────────

describe('calcRequiredCL', () => {
  it('computes correct value for known inputs', () => {
    const CL = calcRequiredCL(1.2, 8, 0.9);
    expect(CL).toBeCloseTo((2 * 1.2 * G) / (RHO * 64 * 0.9), 5);
  });

  it('higher speed reduces required CL', () => {
    expect(calcRequiredCL(1.2, 12, 0.9)).toBeLessThan(calcRequiredCL(1.2, 8, 0.9));
  });

  it('higher weight requires higher CL', () => {
    expect(calcRequiredCL(2.0, 8, 0.9)).toBeGreaterThan(calcRequiredCL(1.0, 8, 0.9));
  });

  it('at stall speed, CL required equals CL_max (by definition)', () => {
    const W = 1.2, S = 0.9, CL_max = 1.5;
    const V_stall = calcStallSpeed(W, S, CL_max);
    expect(calcRequiredCL(W, V_stall, S)).toBeCloseTo(CL_max, 3);
  });
});

// ─── Drag Coefficient ─────────────────────────────────────────────────────────

describe('calcCD', () => {
  it('at CL = 0 returns CD0 = 0.025', () => {
    expect(calcCD(0, 7)).toBeCloseTo(0.025, 5);
  });

  it('increases with CL (induced drag penalty)', () => {
    expect(calcCD(1.0, 7)).toBeGreaterThan(calcCD(0.5, 7));
  });

  it('higher AR reduces induced drag component', () => {
    const CD_lo = calcCD(0.8, 5);
    const CD_hi = calcCD(0.8, 10);
    expect(CD_hi).toBeLessThan(CD_lo);
  });

  it('returns physically plausible value for typical cruise conditions', () => {
    // CL = 0.6, AR = 6 → CD ≈ 0.025 + 0.36 / (π * 0.8 * 6) = 0.025 + 0.024 = 0.049
    expect(calcCD(0.6, 6)).toBeCloseTo(0.049, 2);
  });
});

// ─── Lift to Drag Ratio ───────────────────────────────────────────────────────

describe('calcLiftToDrag', () => {
  it('returns a positive value for positive CL', () => {
    expect(calcLiftToDrag(0.8, 7)).toBeGreaterThan(0);
  });

  it('typical SAE design achieves L/D > 8 at good conditions', () => {
    expect(calcLiftToDrag(0.6, 7)).toBeGreaterThan(8);
  });

  it('L/D peaks at CL_opt and is lower on either side', () => {
    const AR = 7;
    const CL_opt = calcBestLDCL(AR);
    const LD_opt = calcLiftToDrag(CL_opt, AR);
    expect(calcLiftToDrag(CL_opt * 0.5, AR)).toBeLessThan(LD_opt);
    expect(calcLiftToDrag(CL_opt * 2.0, AR)).toBeLessThan(LD_opt);
  });

  it('higher AR increases max achievable L/D', () => {
    const CL = 0.6;
    expect(calcLiftToDrag(CL, 10)).toBeGreaterThan(calcLiftToDrag(CL, 5));
  });
});

// ─── Best L/D Speed ───────────────────────────────────────────────────────────

describe('calcBestLDSpeed', () => {
  it('returns a positive speed', () => {
    expect(calcBestLDSpeed(1.2, 0.9, 7)).toBeGreaterThan(0);
  });

  it('heavier aircraft flies faster at best L/D', () => {
    expect(calcBestLDSpeed(2.0, 0.9, 7)).toBeGreaterThan(calcBestLDSpeed(1.0, 0.9, 7));
  });

  it('smaller wing area increases best L/D speed', () => {
    expect(calcBestLDSpeed(1.2, 0.5, 7)).toBeGreaterThan(calcBestLDSpeed(1.2, 1.5, 7));
  });

  it('higher AR reduces best L/D speed (wing works more efficiently at lower speed)', () => {
    expect(calcBestLDSpeed(1.2, 0.9, 10)).toBeLessThan(calcBestLDSpeed(1.2, 0.9, 5));
  });

  it('typical SAE design best L/D speed is in the 5–12 m/s range', () => {
    const V = calcBestLDSpeed(1.2, 0.9, 7);
    expect(V).toBeGreaterThan(4);
    expect(V).toBeLessThan(15);
  });
});

// ─── Best L/D CL ─────────────────────────────────────────────────────────────

describe('calcBestLDCL', () => {
  it('increases with AR (higher AR → higher optimum CL)', () => {
    expect(calcBestLDCL(10)).toBeGreaterThan(calcBestLDCL(5));
  });

  it('returns a physically plausible value for typical SAE AR', () => {
    const CL = calcBestLDCL(7);
    expect(CL).toBeGreaterThan(0.2);
    expect(CL).toBeLessThan(1.5);
  });
});

// ─── Max L/D ─────────────────────────────────────────────────────────────────

describe('calcMaxLD', () => {
  it('increases with AR', () => {
    expect(calcMaxLD(10)).toBeGreaterThan(calcMaxLD(5));
  });

  it('is consistent with calcLiftToDrag at CL_opt', () => {
    const AR = 7;
    const CL_opt = calcBestLDCL(AR);
    expect(calcMaxLD(AR)).toBeCloseTo(calcLiftToDrag(CL_opt, AR), 3);
  });

  it('typical SAE AR of 6–8 gives max L/D between 10 and 18', () => {
    expect(calcMaxLD(6)).toBeGreaterThan(10);
    expect(calcMaxLD(8)).toBeLessThan(18);
  });
});
