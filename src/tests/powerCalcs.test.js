import { describe, it, expect } from 'vitest';
import { MOTORS, getMotorById } from '../data/motors.js';
import {
  calcBatteryVoltage,
  calcBatteryWeight,
  calcStaticThrust,
  calcTWR,
  calcThrustRequired,
  calcThrustMargin,
  calcMaxPayload,
  calcEndurance,
} from '../logic/powerCalcs.js';

const sunnysky = getMotorById('SUNNYSKY_X2216'); // maxThrustG: 1050, maxCurrentA: 22
const tmotor   = getMotorById('TMOTOR_MN3110');  // maxThrustG: 1800, maxCurrentA: 30
const custom   = getMotorById('CUSTOM');

// ─── Battery Voltage ──────────────────────────────────────────────────────────

describe('calcBatteryVoltage', () => {
  it('3S = 11.1 V', () => {
    expect(calcBatteryVoltage(3)).toBeCloseTo(11.1, 5);
  });

  it('4S = 14.8 V', () => {
    expect(calcBatteryVoltage(4)).toBeCloseTo(14.8, 5);
  });

  it('scales linearly with cell count', () => {
    expect(calcBatteryVoltage(6)).toBeCloseTo(calcBatteryVoltage(3) * 2, 5);
  });
});

// ─── Battery Weight ───────────────────────────────────────────────────────────

describe('calcBatteryWeight', () => {
  it('3S 2200 mAh ≈ 195 g (empirical LiPo average)', () => {
    expect(calcBatteryWeight(3, 2200)).toBeCloseTo(0.195, 2);
  });

  it('increases with cell count', () => {
    expect(calcBatteryWeight(4, 2200)).toBeGreaterThan(calcBatteryWeight(3, 2200));
  });

  it('increases with capacity', () => {
    expect(calcBatteryWeight(3, 4000)).toBeGreaterThan(calcBatteryWeight(3, 2200));
  });

  it('always positive', () => {
    expect(calcBatteryWeight(1, 500)).toBeGreaterThan(0);
  });
});

// ─── Static Thrust ────────────────────────────────────────────────────────────

describe('calcStaticThrust', () => {
  it('full throttle returns motor.maxThrustG', () => {
    expect(calcStaticThrust(sunnysky, 1.0)).toBeCloseTo(1050, 5);
  });

  it('50% throttle returns 50% of max thrust', () => {
    expect(calcStaticThrust(sunnysky, 0.5)).toBeCloseTo(525, 5);
  });

  it('manualThrustG overrides motor database value', () => {
    expect(calcStaticThrust(sunnysky, 1.0, 800)).toBeCloseTo(800, 5);
  });

  it('manualThrustG also scales with throttle fraction', () => {
    expect(calcStaticThrust(custom, 0.75, 1200)).toBeCloseTo(900, 5);
  });
});

// ─── Thrust-to-Weight Ratio ───────────────────────────────────────────────────

describe('calcTWR', () => {
  it('1050 g thrust / 1.2 kg aircraft = 0.875 TWR', () => {
    expect(calcTWR(1050, 1.2)).toBeCloseTo(1050 / 1200, 5);
  });

  it('increases with more thrust', () => {
    expect(calcTWR(1800, 1.5)).toBeGreaterThan(calcTWR(1050, 1.5));
  });

  it('decreases with heavier aircraft', () => {
    expect(calcTWR(1050, 2.0)).toBeLessThan(calcTWR(1050, 1.0));
  });

  it('TWR < 0.3 for a clearly underpowered case', () => {
    expect(calcTWR(200, 2.0)).toBeLessThan(0.3);
  });

  it('TWR ≥ 0.5 for a well-matched SAE Aero setup', () => {
    // 1050 g thrust, 1.2 kg: TWR = 1050/1200 = 0.875
    expect(calcTWR(1050, 1.2)).toBeGreaterThanOrEqual(0.5);
  });
});

// ─── Thrust Required ─────────────────────────────────────────────────────────

describe('calcThrustRequired', () => {
  it('1.2 kg aircraft at L/D = 12 → 1200/12 = 100 g', () => {
    expect(calcThrustRequired(1.2, 12)).toBeCloseTo(100, 3);
  });

  it('higher L/D reduces thrust required', () => {
    expect(calcThrustRequired(1.5, 15)).toBeLessThan(calcThrustRequired(1.5, 10));
  });

  it('heavier aircraft needs more thrust', () => {
    expect(calcThrustRequired(2.0, 12)).toBeGreaterThan(calcThrustRequired(1.0, 12));
  });
});

// ─── Thrust Margin ────────────────────────────────────────────────────────────

describe('calcThrustMargin', () => {
  it('positive when static > required', () => {
    expect(calcThrustMargin(1050, 100)).toBeCloseTo(950, 5);
  });

  it('zero when exactly matched', () => {
    expect(calcThrustMargin(100, 100)).toBeCloseTo(0, 5);
  });

  it('negative when motor cannot sustain level flight', () => {
    expect(calcThrustMargin(80, 100)).toBeLessThan(0);
  });
});

// ─── Max Payload ─────────────────────────────────────────────────────────────

describe('calcMaxPayload', () => {
  it('returns positive payload for a viable design', () => {
    // W_total_max at TWR=0.5: 1050/500 = 2.1 kg; maxPayload = 2.1 - 0.7 = 1.4 kg
    expect(calcMaxPayload(1050, 0.7)).toBeCloseTo(1.4, 3);
  });

  it('increases with more static thrust', () => {
    expect(calcMaxPayload(1800, 0.7)).toBeGreaterThan(calcMaxPayload(1050, 0.7));
  });

  it('decreases as empty weight increases', () => {
    expect(calcMaxPayload(1050, 1.0)).toBeLessThan(calcMaxPayload(1050, 0.5));
  });

  it('negative when empty weight exceeds thrust capacity', () => {
    expect(calcMaxPayload(400, 1.5)).toBeLessThan(0);
  });

  it('respects TWR target: higher target reduces max payload', () => {
    expect(calcMaxPayload(1050, 0.7, 0.7)).toBeLessThan(calcMaxPayload(1050, 0.7, 0.5));
  });
});

// ─── Endurance ───────────────────────────────────────────────────────────────

describe('calcEndurance', () => {
  it('returns a positive duration in minutes for a valid motor', () => {
    const e = calcEndurance(2200, 100, sunnysky, 3);
    expect(e).toBeGreaterThan(0);
  });

  it('larger battery extends endurance', () => {
    const e3000 = calcEndurance(3000, 100, sunnysky, 3);
    const e2200 = calcEndurance(2200, 100, sunnysky, 3);
    expect(e3000).toBeGreaterThan(e2200);
  });

  it('higher cruise thrust requirement reduces endurance', () => {
    const eLow = calcEndurance(2200, 80, sunnysky, 3);
    const eHigh = calcEndurance(2200, 200, sunnysky, 3);
    expect(eLow).toBeGreaterThan(eHigh);
  });

  it('returns null when motor current data is unavailable', () => {
    expect(calcEndurance(2200, 100, custom, 3)).toBeNull();
  });

  it('returns null when thrustRequired is zero', () => {
    expect(calcEndurance(2200, 0, sunnysky, 3)).toBeNull();
  });

  it('manualThrustG works in place of motor.maxThrustG', () => {
    const e = calcEndurance(2200, 100, custom, 3, 1000);
    // custom has null maxCurrentA so still returns null
    expect(e).toBeNull();
  });
});

// ─── Motors data schema ───────────────────────────────────────────────────────

describe('MOTORS data', () => {
  it('all motors have required fields', () => {
    MOTORS.forEach((m) => {
      expect(m).toHaveProperty('id');
      expect(m).toHaveProperty('name');
      expect(m).toHaveProperty('kv');
      expect(m).toHaveProperty('maxCurrentA');
      expect(m).toHaveProperty('weightG');
      expect(m).toHaveProperty('maxThrustG');
      expect(m).toHaveProperty('recommendedPropIn');
      expect(m).toHaveProperty('note');
    });
  });

  it('non-CUSTOM motors have positive numeric specs', () => {
    MOTORS.filter((m) => m.id !== 'CUSTOM').forEach((m) => {
      expect(m.kv).toBeGreaterThan(0);
      expect(m.maxCurrentA).toBeGreaterThan(0);
      expect(m.weightG).toBeGreaterThan(0);
      expect(m.maxThrustG).toBeGreaterThan(0);
    });
  });

  it('CUSTOM motor has null specs', () => {
    expect(custom.kv).toBeNull();
    expect(custom.maxThrustG).toBeNull();
  });

  it('getMotorById throws on unknown id', () => {
    expect(() => getMotorById('NONEXISTENT')).toThrow();
  });

  it('higher max thrust motors have higher weight (physics sanity check)', () => {
    // T-Motor (1800 g thrust) should weigh more than Scorpion (700 g)
    const scorpion = getMotorById('SCORPION_M2204');
    expect(tmotor.weightG).toBeGreaterThan(scorpion.weightG);
  });
});
