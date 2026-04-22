// Common SAE Aero brushless motors.
// maxThrustG: static thrust (g) at full throttle with recommended prop on a typical 3S pack.
// CUSTOM entry: user supplies thrust and weight directly via manualThrustG in the optimizer.

export const MOTORS = [
  {
    id: 'SUNNYSKY_X2216',
    name: 'SunnySky X2216 1100KV',
    kv: 1100,
    maxCurrentA: 22,
    weightG: 68,
    maxThrustG: 1050,
    recommendedPropIn: '10x4.5',
    note: 'Popular SAE Aero workhorse. Good power/weight ratio on 3S.',
  },
  {
    id: 'TURNIGY_2212',
    name: 'Turnigy 2212 1000KV',
    kv: 1000,
    maxCurrentA: 20,
    weightG: 52,
    maxThrustG: 900,
    recommendedPropIn: '10x4.5',
    note: 'Budget option with consistent thrust. Well-documented for SAE builds.',
  },
  {
    id: 'SCORPION_M2204',
    name: 'Scorpion M2204 2300KV',
    kv: 2300,
    maxCurrentA: 18,
    weightG: 32,
    maxThrustG: 700,
    recommendedPropIn: '8x4',
    note: 'Lightweight choice for smaller aircraft under 0.8 kg total weight.',
  },
  {
    id: 'TMOTOR_MN3110',
    name: 'T-Motor MN3110 470KV',
    kv: 470,
    maxCurrentA: 30,
    weightG: 102,
    maxThrustG: 1800,
    recommendedPropIn: '14x4.7',
    note: 'High-thrust heavy-lifter. Requires 4S+ and a large folding prop.',
  },
  {
    id: 'EMAX_GT2215',
    name: 'EMAX GT2215 810KV',
    kv: 810,
    maxCurrentA: 28,
    weightG: 72,
    maxThrustG: 1400,
    recommendedPropIn: '12x6',
    note: 'Good mid-range efficiency. Popular for 1–2 kg total weight builds.',
  },
  {
    id: 'CUSTOM',
    name: 'Custom / Manual Input',
    kv: null,
    maxCurrentA: null,
    weightG: null,
    maxThrustG: null,
    recommendedPropIn: null,
    note: 'Enter motor weight and max thrust directly via optimizer inputs.',
  },
];

export function getMotorById(id) {
  const m = MOTORS.find((m) => m.id === id);
  if (!m) throw new Error(`Unknown motor id: ${id}`);
  return m;
}
