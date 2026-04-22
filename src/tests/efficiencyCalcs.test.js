import { describe, it, expect } from 'vitest';
import { calcEfficiencyScore } from '../logic/efficiencyCalcs.js';

// A "good" design that should score well with no penalties
const goodDesign = {
  payloadFraction: 0.45,    // 45% — solidly in competitive range
  LD_ratio: 14,             // good aerodynamic efficiency
  thrustMarginG: 700,       // large thrust reserve
  W_total_kg: 1.2,
  staticMargin: 0.12,       // healthy 12% SM
  V_stall: 3.8,             // well below 8 m/s launch limit
  V_ht: 0.50,               // above 0.4 threshold
  V_vt: 0.040,              // above 0.02 threshold
  TWR: 0.87,                // strong TWR
  tailConfigId: 'CONVENTIONAL',
};

// ─── Score range ──────────────────────────────────────────────────────────────

describe('calcEfficiencyScore — score bounds', () => {
  it('good design scores above 50', () => {
    const { score } = calcEfficiencyScore(goodDesign);
    expect(score).toBeGreaterThan(50);
  });

  it('score is always between 0 and 100', () => {
    const { score: good } = calcEfficiencyScore(goodDesign);
    expect(good).toBeGreaterThanOrEqual(0);
    expect(good).toBeLessThanOrEqual(100);
  });

  it('worst-case design with all penalties does not go below 0', () => {
    const { score } = calcEfficiencyScore({
      payloadFraction: 0.10,
      LD_ratio: 2,
      thrustMarginG: -500,
      W_total_kg: 2.0,
      staticMargin: -0.20,
      V_stall: 15,
      V_ht: 0.10,
      V_vt: 0.005,
      TWR: 0.10,
      tailConfigId: 'T_TAIL',
    });
    expect(score).toBeGreaterThanOrEqual(0);
  });

  it('good design with no penalties does not exceed 100', () => {
    const { score } = calcEfficiencyScore({
      payloadFraction: 0.65,
      LD_ratio: 25,
      thrustMarginG: 1000,
      W_total_kg: 1.2,
      staticMargin: 0.25,
      V_stall: 2.0,
      V_ht: 0.60,
      V_vt: 0.06,
      TWR: 1.0,
      tailConfigId: 'CONVENTIONAL',
    });
    expect(score).toBeLessThanOrEqual(100);
  });
});

// ─── Score ordering ───────────────────────────────────────────────────────────

describe('calcEfficiencyScore — monotonicity', () => {
  it('higher payload fraction improves score', () => {
    const lo = calcEfficiencyScore({ ...goodDesign, payloadFraction: 0.25 });
    const hi = calcEfficiencyScore({ ...goodDesign, payloadFraction: 0.55 });
    expect(hi.score).toBeGreaterThan(lo.score);
  });

  it('higher L/D improves score', () => {
    const lo = calcEfficiencyScore({ ...goodDesign, LD_ratio: 8 });
    const hi = calcEfficiencyScore({ ...goodDesign, LD_ratio: 16 });
    expect(hi.score).toBeGreaterThan(lo.score);
  });

  it('higher thrust margin improves score', () => {
    const lo = calcEfficiencyScore({ ...goodDesign, thrustMarginG: 100 });
    const hi = calcEfficiencyScore({ ...goodDesign, thrustMarginG: 600 });
    expect(hi.score).toBeGreaterThan(lo.score);
  });

  it('higher static margin (up to 20%) improves score', () => {
    const lo = calcEfficiencyScore({ ...goodDesign, staticMargin: 0.05 });
    const hi = calcEfficiencyScore({ ...goodDesign, staticMargin: 0.18 });
    expect(hi.score).toBeGreaterThan(lo.score);
  });

  it('lower stall speed improves score', () => {
    const lo = calcEfficiencyScore({ ...goodDesign, V_stall: 7.0 });
    const hi = calcEfficiencyScore({ ...goodDesign, V_stall: 3.0 });
    expect(hi.score).toBeGreaterThan(lo.score);
  });
});

// ─── Penalties ────────────────────────────────────────────────────────────────

describe('calcEfficiencyScore — penalties', () => {
  it('VHT_LOW penalty applied when V_ht < 0.4', () => {
    const { score: with_penalty, penalties } = calcEfficiencyScore({ ...goodDesign, V_ht: 0.30 });
    const { score: without_penalty } = calcEfficiencyScore({ ...goodDesign, V_ht: 0.50 });
    expect(with_penalty).toBeLessThan(without_penalty);
    expect(penalties.some((p) => p.code === 'VHT_LOW')).toBe(true);
    expect(penalties.find((p) => p.code === 'VHT_LOW').points).toBe(-20);
  });

  it('VVT_LOW penalty applied when V_vt < 0.02', () => {
    const { penalties } = calcEfficiencyScore({ ...goodDesign, V_vt: 0.010 });
    expect(penalties.some((p) => p.code === 'VVT_LOW')).toBe(true);
    expect(penalties.find((p) => p.code === 'VVT_LOW').points).toBe(-20);
  });

  it('TWR_CRITICAL penalty applied when TWR < 0.3', () => {
    const { penalties } = calcEfficiencyScore({ ...goodDesign, TWR: 0.20 });
    expect(penalties.some((p) => p.code === 'TWR_CRITICAL')).toBe(true);
    expect(penalties.find((p) => p.code === 'TWR_CRITICAL').points).toBe(-30);
  });

  it('UNSTABLE penalty applied when staticMargin < 0', () => {
    const { penalties } = calcEfficiencyScore({ ...goodDesign, staticMargin: -0.05 });
    expect(penalties.some((p) => p.code === 'UNSTABLE')).toBe(true);
    expect(penalties.find((p) => p.code === 'UNSTABLE').points).toBe(-40);
  });

  it('PAYLOAD_FRACTION_LOW penalty applied when payloadFraction < 0.25', () => {
    const { penalties } = calcEfficiencyScore({ ...goodDesign, payloadFraction: 0.20 });
    expect(penalties.some((p) => p.code === 'PAYLOAD_FRACTION_LOW')).toBe(true);
    expect(penalties.find((p) => p.code === 'PAYLOAD_FRACTION_LOW').points).toBe(-15);
  });

  it('T_TAIL penalty applied for T-tail config', () => {
    const { penalties } = calcEfficiencyScore({ ...goodDesign, tailConfigId: 'T_TAIL' });
    expect(penalties.some((p) => p.code === 'T_TAIL')).toBe(true);
    expect(penalties.find((p) => p.code === 'T_TAIL').points).toBe(-5);
  });

  it('no penalties for a clean design', () => {
    const { penalties } = calcEfficiencyScore(goodDesign);
    expect(penalties).toHaveLength(0);
  });

  it('multiple penalties can stack', () => {
    const { penalties } = calcEfficiencyScore({
      ...goodDesign,
      V_ht: 0.20,        // VHT_LOW
      V_vt: 0.005,       // VVT_LOW
      TWR: 0.15,         // TWR_CRITICAL
      staticMargin: -0.1, // UNSTABLE
      payloadFraction: 0.15, // PAYLOAD_FRACTION_LOW
      tailConfigId: 'T_TAIL', // T_TAIL
    });
    expect(penalties.length).toBe(6);
  });
});
